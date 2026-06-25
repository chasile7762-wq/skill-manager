import { summarizeSkills } from '../lib/filters';
import type { SkillRecord } from '../shared/types';

interface OverviewCardsProps {
  skills: SkillRecord[];
  lastScannedAt?: string | null;
}

export function OverviewCards({ skills, lastScannedAt }: OverviewCardsProps) {
  const summary = summarizeSkills(skills);

  const cards = [
    { label: 'Skill 总数', value: summary.total },
    { label: '系统预装', value: summary.system },
    { label: '全局', value: summary.global },
    { label: '项目级', value: summary.project },
    { label: '待处理问题', value: summary.issues },
  ];

  return (
    <section className="overview-grid" aria-label="Skill 总览">
      {cards.map((card) => (
        <article key={card.label} className="metric-card">
          <span className="metric-label">{card.label}</span>
          <strong className="metric-value">{card.value}</strong>
        </article>
      ))}
      <article className="metric-card metric-card-wide">
        <span className="metric-label">最近扫描</span>
        <strong className="metric-value metric-value-small">
          {lastScannedAt ? new Date(lastScannedAt).toLocaleString() : '尚未扫描'}
        </strong>
      </article>
    </section>
  );
}
