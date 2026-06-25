use std::fs;
use std::path::PathBuf;

use crate::error::AppError;
use crate::models::{AppConfig, InstallHistoryEntry, SkillInstallOrigin, UiPreferences};

const APP_FOLDER: &str = "skill-manager";
const CONFIG_FILE: &str = "config.json";

pub struct ConfigStore;

impl ConfigStore {
    pub fn load() -> Result<AppConfig, AppError> {
        let path = Self::config_path()?;
        if !path.exists() {
            return Ok(AppConfig::default());
        }

        let content = fs::read_to_string(path)?;
        let parsed = serde_json::from_str::<AppConfig>(&content).unwrap_or_default();
        Ok(parsed)
    }

    pub fn save(config: &AppConfig) -> Result<(), AppError> {
        let path = Self::config_path()?;
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }

        let content = serde_json::to_string_pretty(config)
            .map_err(|error| AppError::with_details("config_serialize", "Failed to save local app config.", error.to_string()))?;
        fs::write(path, content)?;
        Ok(())
    }

    pub fn save_preferences(preferences: UiPreferences) -> Result<UiPreferences, AppError> {
        let mut config = Self::load()?;
        config.ui_preferences = preferences.clone();
        Self::save(&config)?;
        Ok(preferences)
    }

    pub fn record_install(skill_path: &str, origin: SkillInstallOrigin) -> Result<(), AppError> {
        let mut config = Self::load()?;
        config.install_history.retain(|entry| entry.skill_path != skill_path);
        config.install_history.push(InstallHistoryEntry {
            skill_path: skill_path.into(),
            install_origin: origin,
        });
        Self::save(&config)
    }

    pub fn remove_install_history(skill_path: &str) -> Result<(), AppError> {
        let mut config = Self::load()?;
        config.install_history.retain(|entry| entry.skill_path != skill_path);
        Self::save(&config)
    }

    pub fn update_manual_projects(projects: Vec<String>) -> Result<(), AppError> {
        let mut config = Self::load()?;
        config.manual_projects = projects;
        Self::save(&config)
    }

    pub fn update_last_scanned_at(timestamp: String) -> Result<(), AppError> {
        let mut config = Self::load()?;
        config.last_scanned_at = Some(timestamp);
        Self::save(&config)
    }

    pub fn config_path() -> Result<PathBuf, AppError> {
        if let Ok(raw) = std::env::var("SKILL_MANAGER_CONFIG_DIR") {
            let mut base = PathBuf::from(raw);
            base.push(CONFIG_FILE);
            return Ok(base);
        }

        let mut base = dirs::config_dir().ok_or_else(|| {
            AppError::new("config_dir_missing", "Could not determine a writable config directory.")
        })?;
        base.push(APP_FOLDER);
        base.push(CONFIG_FILE);
        Ok(base)
    }
}
