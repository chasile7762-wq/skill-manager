use crate::error::AppError;
use crate::models::{InstallResult, InstallTargetScope, ProjectRecord, SkillManifestPreview, SkillRecord, UiPreferences};
use crate::services::config_store::ConfigStore;
use crate::services::installer;
use crate::services::project_discovery;
use crate::services::skill_registry;

#[tauri::command]
pub fn scan_all_skills() -> Result<crate::models::AppSnapshot, AppError> {
    skill_registry::scan_all_skills()
}

#[tauri::command]
pub fn discover_projects() -> Result<Vec<ProjectRecord>, AppError> {
    let config = ConfigStore::load()?;
    project_discovery::discover_projects(&config)
}

#[tauri::command]
pub fn add_project(path: String) -> Result<Vec<ProjectRecord>, AppError> {
    let mut config = ConfigStore::load()?;
    if !config.manual_projects.iter().any(|item| item.eq_ignore_ascii_case(&path)) {
        config.manual_projects.push(path);
    }
    ConfigStore::save(&config)?;
    project_discovery::discover_projects(&config)
}

#[tauri::command]
pub fn remove_project(path: String) -> Result<Vec<ProjectRecord>, AppError> {
    let mut config = ConfigStore::load()?;
    config.manual_projects.retain(|item| !item.eq_ignore_ascii_case(&path));
    ConfigStore::save(&config)?;
    project_discovery::discover_projects(&config)
}

#[tauri::command]
pub fn install_skill_from_local(
    source_path: String,
    target_scope: InstallTargetScope,
    project_path: Option<String>,
) -> Result<InstallResult, AppError> {
    installer::install_skill_from_local(source_path, target_scope, project_path)
}

#[tauri::command]
pub fn install_skill_from_github(
    url: String,
    target_scope: InstallTargetScope,
    project_path: Option<String>,
) -> Result<InstallResult, AppError> {
    installer::install_skill_from_github(url, target_scope, project_path)
}

#[tauri::command]
pub fn delete_skill(skill_id: String) -> Result<Vec<SkillRecord>, AppError> {
    installer::delete_skill(skill_id)
}

#[tauri::command]
pub fn read_skill_manifest(skill_path: String) -> Result<SkillManifestPreview, AppError> {
    installer::read_skill_manifest(skill_path)
}

#[tauri::command]
pub fn save_ui_preferences(preferences: UiPreferences) -> Result<UiPreferences, AppError> {
    ConfigStore::save_preferences(preferences)
}
