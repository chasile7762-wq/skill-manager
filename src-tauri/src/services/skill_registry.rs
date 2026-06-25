use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use chrono::Utc;

use crate::error::AppError;
use crate::models::{
    AppConfig, AppSnapshot, ParsedManifest, ProjectRecord, SkillInstallOrigin, SkillRecord, SkillSourceType,
    SkillStatus,
};
use crate::services::config_store::ConfigStore;
use crate::services::manifest::parse_skill_manifest;
use crate::services::project_discovery::discover_projects;

pub fn scan_all_skills() -> Result<AppSnapshot, AppError> {
    let config = ConfigStore::load()?
    ;
    let projects = discover_projects(&config)?;
    let mut skills = Vec::new();

    let codex_root = codex_skills_root()?;
    let system_root = codex_root.join(".system");

    if system_root.exists() {
        skills.extend(scan_directory(
            &system_root,
            SkillSourceType::System,
            None,
            &config,
            true,
        )?);
    }

    if codex_root.exists() {
        for entry in fs::read_dir(&codex_root)? {
            let entry = entry?;
            if !entry.file_type()?.is_dir() {
                continue;
            }

            if entry.file_name().to_string_lossy().starts_with('.') {
                continue;
            }

            skills.push(scan_skill_folder(
                entry.path(),
                SkillSourceType::Global,
                None,
                &config,
                false,
            )?);
        }
    }

    for project in &projects {
        let root = PathBuf::from(&project.skills_dir);
        if !root.exists() {
            continue;
        }
        skills.extend(scan_directory(
            &root,
            SkillSourceType::Project,
            Some(project.project_path.clone()),
            &config,
            false,
        )?);
    }

    mark_duplicates(&mut skills);
    let last_scanned_at = Utc::now().to_rfc3339();
    ConfigStore::update_last_scanned_at(last_scanned_at.clone())?;

    Ok(AppSnapshot {
        skills,
        projects,
        ui_preferences: config.ui_preferences,
        last_scanned_at: Some(last_scanned_at),
    })
}

pub fn scan_directory(
    root: &Path,
    source_type: SkillSourceType,
    project_path: Option<String>,
    config: &AppConfig,
    is_read_only: bool,
) -> Result<Vec<SkillRecord>, AppError> {
    let mut skills = Vec::new();
    for entry in fs::read_dir(root)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }

        skills.push(scan_skill_folder(
            entry.path(),
            source_type.clone(),
            project_path.clone(),
            config,
            is_read_only,
        )?);
    }
    Ok(skills)
}

pub fn scan_skill_folder(
    skill_dir: PathBuf,
    source_type: SkillSourceType,
    project_path: Option<String>,
    config: &AppConfig,
    is_read_only: bool,
) -> Result<SkillRecord, AppError> {
    let folder_name = skill_dir
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| "unknown-skill".into());
    let parsed = parse_skill_manifest(&skill_dir).ok();
    let status = determine_status(parsed.as_ref());
    let name = parsed
        .as_ref()
        .and_then(|manifest| manifest.name.clone())
        .unwrap_or(folder_name);
    let description = parsed
        .as_ref()
        .and_then(|manifest| manifest.description.clone())
        .unwrap_or_default();

    Ok(SkillRecord {
        id: build_skill_id(&source_type, skill_dir.to_string_lossy().as_ref()),
        name,
        source_type: source_type.clone(),
        project_path,
        skill_path: skill_dir.to_string_lossy().to_string(),
        description,
        is_read_only,
        install_origin: lookup_install_origin(config, &source_type, skill_dir.to_string_lossy().as_ref()),
        status,
    })
}

fn determine_status(parsed: Option<&ParsedManifest>) -> SkillStatus {
    match parsed {
        None => SkillStatus::Invalid,
        Some(manifest) if manifest.name.as_deref().unwrap_or("").is_empty() => SkillStatus::MissingMetadata,
        Some(manifest) if manifest.description.as_deref().unwrap_or("").is_empty() => SkillStatus::MissingMetadata,
        Some(_) => SkillStatus::Ok,
    }
}

fn lookup_install_origin(
    config: &AppConfig,
    source_type: &SkillSourceType,
    skill_path: &str,
) -> SkillInstallOrigin {
    if let Some(entry) = config
        .install_history
        .iter()
        .find(|entry| entry.skill_path.eq_ignore_ascii_case(skill_path))
    {
        return entry.install_origin.clone();
    }

    if matches!(source_type, SkillSourceType::System) {
        SkillInstallOrigin::Bundled
    } else {
        SkillInstallOrigin::Local
    }
}

fn mark_duplicates(skills: &mut [SkillRecord]) {
    let mut counts = HashMap::<String, usize>::new();
    for skill in skills.iter() {
        *counts.entry(skill.name.to_lowercase()).or_default() += 1;
    }

    for skill in skills.iter_mut() {
        if counts.get(&skill.name.to_lowercase()).copied().unwrap_or(0) > 1 && skill.status == SkillStatus::Ok {
            skill.status = SkillStatus::Duplicate;
        }
    }
}

pub fn build_skill_id(source_type: &SkillSourceType, skill_path: &str) -> String {
    let source = match source_type {
        SkillSourceType::System => "system",
        SkillSourceType::Global => "global",
        SkillSourceType::Project => "project",
    };
    format!("{source}::{}", skill_path.replace('\\', "/"))
}

pub fn codex_skills_root() -> Result<PathBuf, AppError> {
    let mut root = dirs::home_dir()
        .ok_or_else(|| AppError::new("home_missing", "Could not resolve the user home directory."))?;
    root.push(".codex");
    root.push("skills");
    Ok(root)
}

pub fn find_skill_by_id(skill_id: &str) -> Result<Option<(SkillRecord, Vec<ProjectRecord>)>, AppError> {
    let snapshot = scan_all_skills()?;
    let found = snapshot.skills.into_iter().find(|skill| skill.id == skill_id);
    Ok(found.map(|skill| (skill, snapshot.projects)))
}

#[cfg(test)]
mod tests {
    use crate::models::{SkillInstallOrigin, SkillSourceType};

    use super::{build_skill_id, mark_duplicates};
    use crate::models::{SkillRecord, SkillStatus};

    #[test]
    fn duplicate_names_are_marked() {
        let mut skills = vec![
            SkillRecord {
                id: "1".into(),
                name: "same".into(),
                source_type: SkillSourceType::Global,
                project_path: None,
                skill_path: "a".into(),
                description: String::new(),
                is_read_only: false,
                install_origin: SkillInstallOrigin::Local,
                status: SkillStatus::Ok,
            },
            SkillRecord {
                id: "2".into(),
                name: "same".into(),
                source_type: SkillSourceType::Project,
                project_path: Some("repo".into()),
                skill_path: "b".into(),
                description: String::new(),
                is_read_only: false,
                install_origin: SkillInstallOrigin::Local,
                status: SkillStatus::Ok,
            },
        ];

        mark_duplicates(&mut skills);

        assert!(skills.iter().all(|skill| skill.status == SkillStatus::Duplicate));
    }

    #[test]
    fn skill_id_is_stable() {
        assert_eq!(build_skill_id(&SkillSourceType::Global, "C:\\repo"), "global::C:/repo");
    }
}
