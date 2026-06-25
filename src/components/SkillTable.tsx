import { installOriginLabels, sourceLabels, statusLabels } from '../lib/labels';
import type { ProjectRecord, SkillRecord, SkillStatus, SkillSourceType, UiPreferences } from '../shared/types';

interface SkillTableProps {
  skills: SkillRecord[];
  projects: ProjectRecord[];
  preferences: UiPreferences;
  onPreferencesChange: (patch: Partial<UiPreferences>) => void;
  onSelectSkill: (skill: SkillRecord) => void;
  onDeleteSkill: (skill: SkillRecord) => void;
}

const sourceOptions: Array<SkillSourceType | 'all'> = ['all', 'system', 'global', 'project'];
const statusOptions: Array<SkillStatus | 'all'> = ['all', 'ok', 'invalid', 'missing-metadata', 'duplicate'];

export function SkillTable({
  skills,
  projects,
  preferences,
  onPreferencesChange,
  onSelectSkill,
  onDeleteSkill,
}: SkillTableProps) {
  const getLastSegment = (value: string) => {
    const segments = value.split(/[\\/]/).filter(Boolean);
    return segments[segments.length - 1] ?? value;
  };

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Skill 列表</p>
          <h2>统一清单</h2>
        </div>
        <span className="panel-meta">当前显示 {skills.length} 条</span>
      </div>

      <div className="filters">
        <label>
          <span>搜索</span>
          <input
            value={preferences.search}
            onChange={(event) => onPreferencesChange({ search: event.target.value })}
            placeholder="按名称、描述或路径搜索"
          />
        </label>

        <label>
          <span>来源</span>
          <select
            value={preferences.sourceFilter}
            onChange={(event) =>
              onPreferencesChange({ sourceFilter: event.target.value as UiPreferences['sourceFilter'] })
            }
          >
            {sourceOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? '全部' : sourceLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>状态</span>
          <select
            value={preferences.statusFilter}
            onChange={(event) =>
              onPreferencesChange({ statusFilter: event.target.value as UiPreferences['statusFilter'] })
            }
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? '全部' : statusLabels[option]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>项目</span>
          <select
            value={preferences.projectFilter}
            onChange={(event) =>
              onPreferencesChange({ projectFilter: event.target.value as UiPreferences['projectFilter'] })
            }
          >
            <option value="all">全部</option>
            {projects.map((project) => (
              <option key={project.projectPath} value={project.projectPath}>
                {project.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="skill-table">
          <thead>
            <tr>
              <th>名称</th>
              <th>来源</th>
              <th>状态</th>
              <th>安装来源</th>
              <th>项目</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {skills.map((skill) => (
              <tr key={skill.id}>
                <td>
                  <button className="link-button" onClick={() => onSelectSkill(skill)}>
                    {skill.name}
                  </button>
                </td>
                <td>
                  <span className={`pill pill-${skill.sourceType}`}>{sourceLabels[skill.sourceType]}</span>
                </td>
                <td>{statusLabels[skill.status]}</td>
                <td>{installOriginLabels[skill.installOrigin]}</td>
                <td>{skill.projectPath ? getLastSegment(skill.projectPath) : '—'}</td>
                <td className="actions-cell">
                  <button className="ghost-button" onClick={() => onSelectSkill(skill)}>
                    查看
                  </button>
                  <button
                    className="danger-button"
                    disabled={skill.isReadOnly}
                    onClick={() => onDeleteSkill(skill)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {skills.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-row">
                  当前筛选条件下没有匹配的 skill。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
