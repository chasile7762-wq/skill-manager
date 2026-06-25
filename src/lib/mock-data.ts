import { defaultPreferences } from '../shared/defaults';
import type { AppSnapshot } from '../shared/types';

export const mockSnapshot: AppSnapshot = {
  lastScannedAt: null,
  uiPreferences: defaultPreferences,
  projects: [
    {
      projectPath: 'C:/Users/demo/Documents/repo-a',
      displayName: 'repo-a',
      discoveryMode: 'codex-config',
      skillsDir: 'C:/Users/demo/Documents/repo-a/.agents/skills',
      isReachable: true,
    },
  ],
  skills: [
    {
      id: 'system-openai-docs',
      name: 'openai-docs',
      sourceType: 'system',
      projectPath: null,
      skillPath: 'C:/Users/demo/.codex/skills/.system/openai-docs',
      description: '用于读取 OpenAI 官方文档并附带最新引用。',
      isReadOnly: true,
      installOrigin: 'bundled',
      status: 'ok',
    },
    {
      id: 'global-my-helper',
      name: 'my-helper',
      sourceType: 'global',
      projectPath: null,
      skillPath: 'C:/Users/demo/.codex/skills/my-helper',
      description: '个人可复用的辅助 skill。',
      isReadOnly: false,
      installOrigin: 'local',
      status: 'ok',
    },
    {
      id: 'project-devops',
      name: 'devops-helper',
      sourceType: 'project',
      projectPath: 'C:/Users/demo/Documents/repo-a',
      skillPath: 'C:/Users/demo/Documents/repo-a/.agents/skills/devops-helper',
      description: '项目级交付辅助 skill。',
      isReadOnly: false,
      installOrigin: 'github',
      status: 'duplicate',
    },
  ],
};
