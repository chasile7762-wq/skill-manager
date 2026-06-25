import type {
  InstallTargetScope,
  ProjectDiscoveryMode,
  SkillInstallOrigin,
  SkillSourceType,
  SkillStatus,
} from '../shared/types';

export const sourceLabels: Record<SkillSourceType, string> = {
  system: '系统预装',
  global: '全局',
  project: '项目',
};

export const statusLabels: Record<SkillStatus, string> = {
  ok: '正常',
  invalid: '无效',
  'missing-metadata': '缺少元数据',
  duplicate: '重名冲突',
};

export const installOriginLabels: Record<SkillInstallOrigin, string> = {
  local: '本地导入',
  github: 'GitHub 导入',
  bundled: '内置预装',
};

export const discoveryModeLabels: Record<ProjectDiscoveryMode, string> = {
  manual: '手动添加',
  'codex-config': 'Codex 已信任项目',
};

export const scopeLabels: Record<InstallTargetScope, string> = {
  global: '全局',
  project: '项目',
};
