import type { SkillRecord, UiPreferences } from '../shared/types';

export function filterSkills(skills: SkillRecord[], preferences: UiPreferences): SkillRecord[] {
  const term = preferences.search.trim().toLowerCase();

  return skills.filter((skill) => {
    if (preferences.sourceFilter !== 'all' && skill.sourceType !== preferences.sourceFilter) {
      return false;
    }

    if (preferences.statusFilter !== 'all' && skill.status !== preferences.statusFilter) {
      return false;
    }

    if (preferences.projectFilter !== 'all') {
      const target = skill.projectPath ?? '';
      if (target !== preferences.projectFilter) {
        return false;
      }
    }

    if (!term) {
      return true;
    }

    return [skill.name, skill.description, skill.skillPath]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });
}

export function summarizeSkills(skills: SkillRecord[]) {
  return skills.reduce(
    (summary, skill) => {
      summary.total += 1;
      summary[skill.sourceType] += 1;
      if (skill.status !== 'ok') {
        summary.issues += 1;
      }
      return summary;
    },
    { total: 0, system: 0, global: 0, project: 0, issues: 0 },
  );
}
