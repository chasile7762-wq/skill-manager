import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from '../App';

vi.mock('../lib/tauri', async () => {
  const actual = await vi.importActual<typeof import('../lib/tauri')>('../lib/tauri');
  return {
    ...actual,
    scanAllSkills: vi.fn().mockResolvedValue({
      lastScannedAt: '2026-06-25T00:00:00Z',
      uiPreferences: {
        search: '',
        sourceFilter: 'all',
        statusFilter: 'all',
        projectFilter: 'all',
      },
      projects: [],
      skills: [
        {
          id: '1',
          name: 'openai-docs',
          sourceType: 'system',
          projectPath: null,
          skillPath: 'C:/skills/openai-docs',
          description: 'Read docs',
          isReadOnly: true,
          installOrigin: 'bundled',
          status: 'ok',
        },
      ],
    }),
    saveUiPreferences: vi.fn().mockResolvedValue({
      search: '',
      sourceFilter: 'all',
      statusFilter: 'all',
      projectFilter: 'all',
    }),
  };
});

describe('App', () => {
  it('renders fetched skill inventory', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByText('openai-docs')).toBeInTheDocument());
    expect(screen.getByText('把全局、系统预装、项目预装 skill 放进同一个控制台里统一管理。')).toBeInTheDocument();
  });
});
