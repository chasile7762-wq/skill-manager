import { useState, type FormEvent } from 'react';
import { scopeLabels } from '../lib/labels';
import type { InstallTargetScope, ProjectRecord } from '../shared/types';

interface InstallDialogProps {
  isOpen: boolean;
  projects: ProjectRecord[];
  onClose: () => void;
  onInstallLocal: (sourcePath: string, scope: InstallTargetScope, projectPath?: string) => Promise<void>;
  onInstallGithub: (url: string, scope: InstallTargetScope, projectPath?: string) => Promise<void>;
}

export function InstallDialog({
  isOpen,
  projects,
  onClose,
  onInstallLocal,
  onInstallGithub,
}: InstallDialogProps) {
  const [scope, setScope] = useState<InstallTargetScope>('global');
  const [projectPath, setProjectPath] = useState('');
  const [localPath, setLocalPath] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isOpen) {
    return null;
  }

  const effectiveProjectPath = scope === 'project' ? projectPath || projects[0]?.projectPath : undefined;

  async function submitLocal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onInstallLocal(localPath.trim(), scope, effectiveProjectPath);
      setLocalPath('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  async function submitGithub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await onInstallGithub(githubUrl.trim(), scope, effectiveProjectPath);
      setGithubUrl('');
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="安装 skill">
      <div className="modal-card">
        <div className="panel-header">
          <div>
            <p className="eyebrow">安装</p>
            <h2>添加 skill</h2>
          </div>
          <button className="ghost-button" onClick={onClose}>
            关闭
          </button>
        </div>

        <div className="form-grid compact">
          <label>
            <span>安装目标</span>
            <select value={scope} onChange={(event) => setScope(event.target.value as InstallTargetScope)}>
              <option value="global">{scopeLabels.global}</option>
              <option value="project">{scopeLabels.project}</option>
            </select>
          </label>
          <label>
            <span>目标项目</span>
            <select
              disabled={scope !== 'project'}
              value={projectPath}
              onChange={(event) => setProjectPath(event.target.value)}
            >
              <option value="">请选择项目</option>
              {projects.map((project) => (
                <option key={project.projectPath} value={project.projectPath}>
                  {project.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="stack">
          <form className="stack" onSubmit={submitLocal}>
            <label>
              <span>本地 skill 目录</span>
              <input
                value={localPath}
                onChange={(event) => setLocalPath(event.target.value)}
                placeholder="例如：C:/Users/name/Downloads/my-skill"
              />
            </label>
            <button className="primary-button" disabled={busy || !localPath.trim()} type="submit">
              从本地目录安装
            </button>
          </form>

          <form className="stack" onSubmit={submitGithub}>
            <label>
              <span>GitHub tree 链接</span>
              <input
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
                placeholder="https://github.com/owner/repo/tree/main/skills/my-skill"
              />
            </label>
            <button className="secondary-button" disabled={busy || !githubUrl.trim()} type="submit">
              从 GitHub 安装
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
