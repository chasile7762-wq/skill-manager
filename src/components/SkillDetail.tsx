import { installOriginLabels, sourceLabels, statusLabels } from '../lib/labels';
import type { SkillManifestPreview, SkillRecord } from '../shared/types';

interface SkillDetailProps {
  skill: SkillRecord | null;
  manifest: SkillManifestPreview | null;
  onReload: () => void;
}

export function SkillDetail({ skill, manifest, onReload }: SkillDetailProps) {
  return (
    <aside className="detail-panel">
      <div className="detail-header">
        <div>
          <p className="eyebrow">详情</p>
          <h2>{skill?.name ?? '请选择一个 skill'}</h2>
        </div>
        {skill ? (
          <button className="ghost-button" onClick={onReload}>
            重新读取清单
          </button>
        ) : null}
      </div>

      {!skill ? (
        <p className="empty-state">请先从左侧列表选择一个 skill，再查看它的来源、状态和元数据。</p>
      ) : (
        <div className="stack">
          <div className="detail-item">
            <div className="row-inline">
              <strong>来源</strong>
              <span className={`pill pill-${skill.sourceType}`}>{sourceLabels[skill.sourceType]}</span>
            </div>
            <p>{skill.description || '没有读取到说明描述。'}</p>
          </div>

          <ul className="detail-list">
            <li className="detail-item">
              <strong>状态</strong>
              <p>{statusLabels[skill.status]}</p>
            </li>
            <li className="detail-item">
              <strong>安装来源</strong>
              <p>{installOriginLabels[skill.installOrigin]}</p>
            </li>
            <li className="detail-item">
              <strong>是否只读</strong>
              <p>{skill.isReadOnly ? '是' : '否'}</p>
            </li>
            <li className="detail-item">
              <strong>所属项目</strong>
              <p>{skill.projectPath ?? '全局范围'}</p>
            </li>
            <li className="detail-item">
              <strong>Skill 路径</strong>
              <p>{skill.skillPath}</p>
            </li>
          </ul>

          <div className="detail-item">
            <strong>清单预览</strong>
            <pre>{manifest?.rawFrontmatter ?? '没有可显示的 frontmatter 预览。'}</pre>
          </div>
        </div>
      )}
    </aside>
  );
}
