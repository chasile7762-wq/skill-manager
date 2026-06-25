import { useState, type FormEvent } from 'react';
import { discoveryModeLabels } from '../lib/labels';
import type { ProjectRecord } from '../shared/types';

interface ProjectPanelProps {
  projects: ProjectRecord[];
  onRefresh: () => void;
  onAddProject: (path: string) => Promise<void>;
  onRemoveProject: (path: string) => Promise<void>;
}

export function ProjectPanel({
  projects,
  onRefresh,
  onAddProject,
  onRemoveProject,
}: ProjectPanelProps) {
  const [path, setPath] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleAddProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!path.trim()) {
      return;
    }

    setBusy(true);
    try {
      await onAddProject(path.trim());
      setPath('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">项目</p>
          <h2>项目发现与管理</h2>
        </div>
        <button className="secondary-button" onClick={onRefresh}>
          刷新项目列表
        </button>
      </div>

      <form className="stack" onSubmit={handleAddProject}>
        <label>
          <span>手动添加项目路径</span>
          <input
            value={path}
            onChange={(event) => setPath(event.target.value)}
            placeholder="例如：C:/Users/name/Documents/project"
          />
        </label>
        <button className="primary-button" disabled={busy} type="submit">
          添加项目
        </button>
      </form>

      <ul className="project-list" aria-label="已管理项目">
        {projects.map((project) => (
          <li key={project.projectPath} className="project-item">
            <div className="project-topline">
              <div>
                <strong>{project.displayName}</strong>
                <p className="hint">{project.projectPath}</p>
              </div>
              <span className={`pill pill-${project.isReachable ? 'global' : 'project'}`}>
                {discoveryModeLabels[project.discoveryMode]}
              </span>
            </div>
            <p className="hint">Skill 目录：{project.skillsDir}</p>
            <div className="project-actions">
              <button className="ghost-button" onClick={() => onRemoveProject(project.projectPath)}>
                移除
              </button>
            </div>
          </li>
        ))}
        {projects.length === 0 ? <li className="empty-state">当前还没有纳入管理的项目。</li> : null}
      </ul>
    </section>
  );
}
