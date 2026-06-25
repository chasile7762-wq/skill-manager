use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use tempfile::tempdir;
use walkdir::WalkDir;

use crate::error::AppError;
use crate::models::{InstallResult, InstallTargetScope, SkillInstallOrigin, SkillManifestPreview, SkillRecord};
use crate::services::config_store::ConfigStore;
use crate::services::manifest::parse_skill_manifest;
use crate::services::skill_registry::{codex_skills_root, find_skill_by_id, scan_all_skills};

pub fn install_skill_from_local(
    source_path: String,
    target_scope: InstallTargetScope,
    project_path: Option<String>,
) -> Result<InstallResult, AppError> {
    let source = PathBuf::from(&source_path);
    install_from_dir(&source, target_scope, project_path, SkillInstallOrigin::Local)
}

pub fn install_skill_from_github(
    url: String,
    target_scope: InstallTargetScope,
    project_path: Option<String>,
) -> Result<InstallResult, AppError> {
    let github = parse_github_tree_url(&url)?;
    let temp = tempdir()?;
    let repo_dir = temp.path().join("repo");

    run_git(
        Command::new("git")
            .args([
                "clone",
                "--depth",
                "1",
                "--branch",
                &github.reference,
                &github.repo_url,
                repo_dir.to_string_lossy().as_ref(),
            ]),
    )?;

    let source = repo_dir.join(github.subpath);
    install_from_dir(&source, target_scope, project_path, SkillInstallOrigin::Github)
}

pub fn delete_skill(skill_id: String) -> Result<Vec<SkillRecord>, AppError> {
    let (skill, _) = find_skill_by_id(&skill_id)?
        .ok_or_else(|| AppError::new("skill_not_found", "Skill could not be found for deletion."))?;

    if skill.is_read_only {
        return Err(AppError::new(
            "skill_read_only",
            "System skills are read-only and cannot be deleted.",
        ));
    }

    fs::remove_dir_all(&skill.skill_path)?;
    ConfigStore::remove_install_history(&skill.skill_path)?;

    Ok(scan_all_skills()?.skills)
}

pub fn read_skill_manifest(skill_path: String) -> Result<SkillManifestPreview, AppError> {
    let path = PathBuf::from(&skill_path);
    let manifest = parse_skill_manifest(&path)?;
    Ok(SkillManifestPreview {
        name: manifest.name,
        description: manifest.description,
        raw_frontmatter: manifest.raw_frontmatter,
        skill_path,
    })
}

fn install_from_dir(
    source: &Path,
    target_scope: InstallTargetScope,
    project_path: Option<String>,
    origin: SkillInstallOrigin,
) -> Result<InstallResult, AppError> {
    if !source.exists() || !source.is_dir() {
        return Err(AppError::new(
            "source_not_found",
            "The selected skill source directory does not exist.",
        ));
    }

    let manifest = parse_skill_manifest(source)?;
    let skill_name = manifest
        .name
        .clone()
        .ok_or_else(|| AppError::new("skill_invalid", "The source directory is not a valid skill."))?;

    let target_root = resolve_target_root(&target_scope, project_path)?;
    fs::create_dir_all(&target_root)?;
    let destination = target_root.join(&skill_name);
    if destination.exists() {
        return Err(AppError::new(
            "skill_conflict",
            "A skill with the same name already exists in the target scope.",
        ));
    }

    copy_recursively(source, &destination)?;
    ConfigStore::record_install(destination.to_string_lossy().as_ref(), origin)?;

    let snapshot = scan_all_skills()?;
    let installed_skill = snapshot
        .skills
        .iter()
        .find(|skill| skill.skill_path.eq_ignore_ascii_case(destination.to_string_lossy().as_ref()))
        .cloned()
        .ok_or_else(|| AppError::new("skill_missing_after_install", "Installed skill could not be rediscovered."))?;

    Ok(InstallResult {
        skills: snapshot.skills,
        projects: snapshot.projects,
        installed_skill,
        last_scanned_at: snapshot.last_scanned_at,
    })
}

fn resolve_target_root(
    target_scope: &InstallTargetScope,
    project_path: Option<String>,
) -> Result<PathBuf, AppError> {
    match target_scope {
        InstallTargetScope::Global => codex_skills_root(),
        InstallTargetScope::Project => {
            let project = project_path.ok_or_else(|| {
                AppError::new("project_required", "Project path is required for project-scoped installation.")
            })?;
            Ok(PathBuf::from(project).join(".agents").join("skills"))
        }
    }
}

fn copy_recursively(source: &Path, destination: &Path) -> Result<(), AppError> {
    for entry in WalkDir::new(source) {
        let entry = entry.map_err(|error| AppError::with_details("walkdir_error", "Failed while copying skill files.", error.to_string()))?;
        let relative = entry.path().strip_prefix(source).map_err(|error| {
            AppError::with_details("copy_error", "Could not compute copied file path.", error.to_string())
        })?;
        let target = destination.join(relative);
        if entry.file_type().is_dir() {
            fs::create_dir_all(&target)?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(entry.path(), &target)?;
        }
    }
    Ok(())
}

struct GithubTreeUrl {
    repo_url: String,
    reference: String,
    subpath: String,
}

fn parse_github_tree_url(url: &str) -> Result<GithubTreeUrl, AppError> {
    let pattern = regex::Regex::new(
        r"^https://github\.com/(?P<owner>[^/]+)/(?P<repo>[^/]+)/tree/(?P<reference>[^/]+)/(?P<path>.+)$",
    )
    .map_err(|error| AppError::with_details("github_regex", "GitHub URL parser failed to initialize.", error.to_string()))?;

    let captures = pattern.captures(url).ok_or_else(|| {
        AppError::new(
            "github_url_invalid",
            "GitHub installs require a directory-level tree URL.",
        )
    })?;

    let owner = captures.name("owner").unwrap().as_str();
    let repo = captures.name("repo").unwrap().as_str();
    let reference = captures.name("reference").unwrap().as_str();
    let path = captures.name("path").unwrap().as_str();

    Ok(GithubTreeUrl {
        repo_url: format!("https://github.com/{owner}/{repo}.git"),
        reference: reference.into(),
        subpath: path.into(),
    })
}

fn run_git(command: &mut Command) -> Result<(), AppError> {
    let output = command.output()?;
    if output.status.success() {
        return Ok(());
    }

    Err(AppError::with_details(
        "git_command_failed",
        "GitHub installation failed while invoking git.",
        String::from_utf8_lossy(&output.stderr).to_string(),
    ))
}

#[cfg(test)]
mod tests {
    use super::parse_github_tree_url;

    #[test]
    fn parses_tree_url() {
        let parsed = parse_github_tree_url(
            "https://github.com/openai/skills/tree/main/skills/.curated/example-skill",
        )
        .expect("should parse");

        assert_eq!(parsed.reference, "main");
        assert_eq!(parsed.subpath, "skills/.curated/example-skill");
    }
}
