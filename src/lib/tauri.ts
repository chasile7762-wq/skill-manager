import { invoke } from '@tauri-apps/api/tauri';
import { defaultPreferences } from '../shared/defaults';
import { mockSnapshot } from './mock-data';
import type {
  AppSnapshot,
  InstallResult,
  InstallTargetScope,
  ProjectRecord,
  SkillManifestPreview,
  SkillRecord,
  UiPreferences,
} from '../shared/types';

function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_IPC__' in window;
}

export async function scanAllSkills(): Promise<AppSnapshot> {
  if (!isTauriRuntime()) {
    return mockSnapshot;
  }

  return invoke<AppSnapshot>('scan_all_skills');
}

export async function discoverProjects(): Promise<ProjectRecord[]> {
  if (!isTauriRuntime()) {
    return mockSnapshot.projects;
  }

  return invoke<ProjectRecord[]>('discover_projects');
}

export async function addProject(projectPath: string): Promise<ProjectRecord[]> {
  if (!isTauriRuntime()) {
    const segments = projectPath.split(/[\\/]/).filter(Boolean);
    return [...mockSnapshot.projects, {
      projectPath,
      displayName: segments[segments.length - 1] ?? projectPath,
      discoveryMode: 'manual',
      skillsDir: `${projectPath}/.agents/skills`,
      isReachable: true,
    }];
  }

  return invoke<ProjectRecord[]>('add_project', { path: projectPath });
}

export async function removeProject(projectPath: string): Promise<ProjectRecord[]> {
  if (!isTauriRuntime()) {
    return mockSnapshot.projects.filter((project) => project.projectPath !== projectPath);
  }

  return invoke<ProjectRecord[]>('remove_project', { path: projectPath });
}

export async function installSkillFromLocal(
  sourcePath: string,
  targetScope: InstallTargetScope,
  projectPath?: string,
): Promise<InstallResult> {
  if (!isTauriRuntime()) {
    return {
      ...mockSnapshot,
      installedSkill: mockSnapshot.skills[1],
    };
  }

  return invoke<InstallResult>('install_skill_from_local', {
    sourcePath,
    targetScope,
    projectPath,
  });
}

export async function installSkillFromGithub(
  url: string,
  targetScope: InstallTargetScope,
  projectPath?: string,
): Promise<InstallResult> {
  if (!isTauriRuntime()) {
    return {
      ...mockSnapshot,
      installedSkill: mockSnapshot.skills[2],
    };
  }

  return invoke<InstallResult>('install_skill_from_github', {
    url,
    targetScope,
    projectPath,
  });
}

export async function deleteSkill(skillId: string): Promise<SkillRecord[]> {
  if (!isTauriRuntime()) {
    return mockSnapshot.skills.filter((skill) => skill.id !== skillId);
  }

  return invoke<SkillRecord[]>('delete_skill', { skillId });
}

export async function readSkillManifest(skillPath: string): Promise<SkillManifestPreview> {
  if (!isTauriRuntime()) {
    return {
      skillPath,
      name: 'mock-skill',
      description: '浏览器预览模式下的模拟清单。',
      rawFrontmatter: 'name: mock-skill\ndescription: 浏览器预览模式下的模拟 skill',
    };
  }

  return invoke<SkillManifestPreview>('read_skill_manifest', { skillPath });
}

export async function saveUiPreferences(preferences: UiPreferences): Promise<UiPreferences> {
  if (!isTauriRuntime()) {
    return preferences;
  }

  return invoke<UiPreferences>('save_ui_preferences', { preferences });
}

export function getSafeDefaultPreferences(): UiPreferences {
  return defaultPreferences;
}
