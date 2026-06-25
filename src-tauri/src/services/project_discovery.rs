use std::collections::BTreeMap;
use std::fs;
use std::path::PathBuf;

use crate::error::AppError;
use crate::models::{AppConfig, ProjectDiscoveryMode, ProjectRecord};

pub fn discover_projects(config: &AppConfig) -> Result<Vec<ProjectRecord>, AppError> {
    let mut found = BTreeMap::<String, ProjectRecord>::new();

    for project in discover_from_codex_config()? {
        found.insert(project.project_path.clone(), project);
    }

    for path in &config.manual_projects {
        found
            .entry(path.clone())
            .or_insert_with(|| record_for_path(path.clone(), ProjectDiscoveryMode::Manual));
    }

    Ok(found.into_values().collect())
}

fn discover_from_codex_config() -> Result<Vec<ProjectRecord>, AppError> {
    let path = codex_config_path() ?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(path)?;
    let value = content.parse::<toml::Value>()?;

    let mut projects = Vec::new();
    if let Some(table) = value.get("projects").and_then(|value| value.as_table()) {
        for key in table.keys() {
            projects.push(record_for_path(key.clone(), ProjectDiscoveryMode::CodexConfig));
        }
    }

    Ok(projects)
}

fn record_for_path(project_path: String, discovery_mode: ProjectDiscoveryMode) -> ProjectRecord {
    let skills_dir = format!("{project_path}{}{}", std::path::MAIN_SEPARATOR, ".agents");
    let skills_dir = format!("{skills_dir}{}skills", std::path::MAIN_SEPARATOR);
    let display_name = PathBuf::from(&project_path)
        .file_name()
        .map(|value| value.to_string_lossy().to_string())
        .unwrap_or_else(|| project_path.clone());

    ProjectRecord {
        project_path,
        display_name,
        discovery_mode,
        skills_dir: skills_dir.clone(),
        is_reachable: PathBuf::from(skills_dir).exists(),
    }
}

fn codex_config_path() -> Result<PathBuf, AppError> {
    let mut path = dirs::home_dir()
        .ok_or_else(|| AppError::new("home_missing", "Could not resolve the user home directory."))?;
    path.push(".codex");
    path.push("config.toml");
    Ok(path)
}

#[cfg(test)]
mod tests {
    use crate::models::ProjectDiscoveryMode;

    use super::record_for_path;

    #[test]
    fn computes_project_skills_dir() {
        let project = record_for_path("C:/repo-a".into(), ProjectDiscoveryMode::Manual);
        assert!(project.skills_dir.ends_with(".agents/skills") || project.skills_dir.ends_with(".agents\\skills"));
    }
}
