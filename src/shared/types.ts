export type SkillSourceType = 'system' | 'global' | 'project';
export type SkillInstallOrigin = 'local' | 'github' | 'bundled';
export type SkillStatus = 'ok' | 'invalid' | 'missing-metadata' | 'duplicate';
export type ProjectDiscoveryMode = 'manual' | 'codex-config';
export type InstallTargetScope = 'global' | 'project';

export interface SkillRecord {
  id: string;
  name: string;
  sourceType: SkillSourceType;
  projectPath?: string | null;
  skillPath: string;
  description: string;
  isReadOnly: boolean;
  installOrigin: SkillInstallOrigin;
  status: SkillStatus;
}

export interface ProjectRecord {
  projectPath: string;
  displayName: string;
  discoveryMode: ProjectDiscoveryMode;
  skillsDir: string;
  isReachable: boolean;
}

export interface UiPreferences {
  search: string;
  sourceFilter: SkillSourceType | 'all';
  statusFilter: SkillStatus | 'all';
  projectFilter: string | 'all';
}

export interface SkillManifestPreview {
  name?: string | null;
  description?: string | null;
  rawFrontmatter?: string | null;
  skillPath: string;
}

export interface AppSnapshot {
  skills: SkillRecord[];
  projects: ProjectRecord[];
  uiPreferences: UiPreferences;
  lastScannedAt?: string | null;
}

export interface StructuredError {
  code: string;
  message: string;
  details?: string | null;
}

export interface InstallResult {
  skills: SkillRecord[];
  projects: ProjectRecord[];
  installedSkill: SkillRecord;
  lastScannedAt?: string | null;
}
