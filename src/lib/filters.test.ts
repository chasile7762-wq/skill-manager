import { describe, expect, it } from 'vitest';
import { filterSkills, summarizeSkills } from './filters';
import type { SkillRecord, UiPreferences } from '../shared/types';

const skills: SkillRecord[] = [
  {
    id: '1',
    name: 'alpha',
    sourceType: 'global',
    projectPath: null,
    skillPath: 'C:/global/alpha',
    description: 'Global skill',
    isReadOnly: false,
    installOrigin: 'local',
    status: 'ok',
  },
  {
    id: '2',
    name: 'beta',
    sourceType: 'project',
    projectPath: 'C:/repo-a',
    skillPath: 'C:/repo-a/.agents/skills/beta',
    description: 'Project beta skill',
    isReadOnly: false,
    installOrigin: 'github',
    status: 'duplicate',
  },
];

const base: UiPreferences = {
  search: '',
  sourceFilter: 'all',
  statusFilter: 'all',
  projectFilter: 'all',
};

describe('filterSkills', () => {
  it('filters by source and search term', () => {
    const result = filterSkills(skills, {
      ...base,
      sourceFilter: 'project',
      search: 'beta',
    });

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('beta');
  });
});

describe('summarizeSkills', () => {
  it('counts totals and issues', () => {
    expect(summarizeSkills(skills)).toEqual({
      total: 2,
      system: 0,
      global: 1,
      project: 1,
      issues: 1,
    });
  });
});
