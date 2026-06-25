use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SkillSourceType {
    System,
    Global,
    Project,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SkillInstallOrigin {
    Local,
    Github,
    Bundled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum SkillStatus {
    Ok,
    Invalid,
    MissingMetadata,
    Duplicate,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "kebab-case")]
pub enum ProjectDiscoveryMode {
    Manual,
    CodexConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum InstallTargetScope {
    Global,
    Project,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillRecord {
    pub id: String,
    pub name: String,
    pub source_type: SkillSourceType,
    pub project_path: Option<String>,
    pub skill_path: String,
    pub description: String,
    pub is_read_only: bool,
    pub install_origin: SkillInstallOrigin,
    pub status: SkillStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRecord {
    pub project_path: String,
    pub display_name: String,
    pub discovery_mode: ProjectDiscoveryMode,
    pub skills_dir: String,
    pub is_reachable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UiPreferences {
    pub search: String,
    pub source_filter: String,
    pub status_filter: String,
    pub project_filter: String,
}

impl Default for UiPreferences {
    fn default() -> Self {
        Self {
            search: String::new(),
            source_filter: "all".into(),
            status_filter: "all".into(),
            project_filter: "all".into(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSnapshot {
    pub skills: Vec<SkillRecord>,
    pub projects: Vec<ProjectRecord>,
    pub ui_preferences: UiPreferences,
    pub last_scanned_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillManifestPreview {
    pub name: Option<String>,
    pub description: Option<String>,
    pub raw_frontmatter: Option<String>,
    pub skill_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallResult {
    pub skills: Vec<SkillRecord>,
    pub projects: Vec<ProjectRecord>,
    pub installed_skill: SkillRecord,
    pub last_scanned_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub manual_projects: Vec<String>,
    pub ui_preferences: UiPreferences,
    pub install_history: Vec<InstallHistoryEntry>,
    pub last_scanned_at: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            manual_projects: Vec::new(),
            ui_preferences: UiPreferences::default(),
            install_history: Vec::new(),
            last_scanned_at: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallHistoryEntry {
    pub skill_path: String,
    pub install_origin: SkillInstallOrigin,
}

#[derive(Debug, Clone)]
pub struct ParsedManifest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub raw_frontmatter: Option<String>,
}
