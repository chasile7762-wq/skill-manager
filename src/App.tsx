import { useEffect, useMemo, useState } from 'react';
import { OverviewCards } from './components/OverviewCards';
import { ProjectPanel } from './components/ProjectPanel';
import { SkillDetail } from './components/SkillDetail';
import { SkillTable } from './components/SkillTable';
import { InstallDialog } from './components/InstallDialog';
import { filterSkills } from './lib/filters';
import {
  addProject,
  deleteSkill,
  discoverProjects,
  getSafeDefaultPreferences,
  installSkillFromGithub,
  installSkillFromLocal,
  readSkillManifest,
  removeProject,
  saveUiPreferences,
  scanAllSkills,
} from './lib/tauri';
import type { AppSnapshot, SkillManifestPreview, SkillRecord, StructuredError, UiPreferences } from './shared/types';

function toMessage(error: unknown): StructuredError {
  if (typeof error === 'object' && error && 'message' in error) {
    const maybe = error as { message?: string; code?: string; details?: string };
    return {
      code: maybe.code ?? 'unknown',
      message: maybe.message ?? 'Unexpected error',
      details: maybe.details ?? null,
    };
  }

  return {
    code: 'unknown',
    message: String(error),
    details: null,
  };
}

export function App() {
  const [snapshot, setSnapshot] = useState<AppSnapshot>({
    skills: [],
    projects: [],
    uiPreferences: getSafeDefaultPreferences(),
    lastScannedAt: null,
  });
  const [selectedSkill, setSelectedSkill] = useState<SkillRecord | null>(null);
  const [manifest, setManifest] = useState<SkillManifestPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [flash, setFlash] = useState<StructuredError | null>(null);

  const visibleSkills = useMemo(
    () => filterSkills(snapshot.skills, snapshot.uiPreferences),
    [snapshot.skills, snapshot.uiPreferences],
  );

  async function hydrate() {
    setLoading(true);
    try {
      const data = await scanAllSkills();
      setSnapshot(data);
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function refreshProjects() {
    try {
      const projects = await discoverProjects();
      setSnapshot((current) => ({ ...current, projects }));
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function syncSelection(skill: SkillRecord | null) {
    setSelectedSkill(skill);
    if (!skill) {
      setManifest(null);
      return;
    }

    try {
      setManifest(null);
      setManifest(await readSkillManifest(skill.skillPath));
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function updatePreferences(patch: Partial<UiPreferences>) {
    const next = { ...snapshot.uiPreferences, ...patch };
    setSnapshot((current) => ({ ...current, uiPreferences: next }));

    try {
      await saveUiPreferences(next);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function handleAddProject(path: string) {
    try {
      const projects = await addProject(path);
      setSnapshot((current) => ({ ...current, projects }));
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function handleRemoveProject(path: string) {
    try {
      const projects = await removeProject(path);
      setSnapshot((current) => ({ ...current, projects }));
      if (selectedSkill?.projectPath === path) {
        await syncSelection(null);
      }
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function handleDeleteSkill(skill: SkillRecord) {
    if (skill.isReadOnly) {
      return;
    }

    try {
      const skills = await deleteSkill(skill.id);
      setSnapshot((current) => ({ ...current, skills }));
      if (selectedSkill?.id === skill.id) {
        await syncSelection(null);
      }
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function handleInstallLocal(sourcePath: string, targetScope: 'global' | 'project', projectPath?: string) {
    try {
      const result = await installSkillFromLocal(sourcePath, targetScope, projectPath);
      setSnapshot((current) => ({
        skills: result.skills,
        projects: result.projects,
        uiPreferences: current.uiPreferences,
        lastScannedAt: result.lastScannedAt ?? new Date().toISOString(),
      }));
      await syncSelection(result.installedSkill);
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  async function handleInstallGithub(url: string, targetScope: 'global' | 'project', projectPath?: string) {
    try {
      const result = await installSkillFromGithub(url, targetScope, projectPath);
      setSnapshot((current) => ({
        skills: result.skills,
        projects: result.projects,
        uiPreferences: current.uiPreferences,
        lastScannedAt: result.lastScannedAt ?? new Date().toISOString(),
      }));
      await syncSelection(result.installedSkill);
      setFlash(null);
    } catch (error) {
      setFlash(toMessage(error));
    }
  }

  useEffect(() => {
    void hydrate();
  }, []);

  return (
    <main className="page-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Codex Skill 管理器</p>
          <h1>把全局、系统预装、项目预装 skill 放进同一个控制台里统一管理。</h1>
          <p>
            你可以查看预装 skill、识别重名冲突、安装新的 skill，并且在不反复翻找隐藏目录的情况下，
            管理每个项目自己的 skill 文件夹。
          </p>
        </div>
        <div className="hero-actions">
          <button className="primary-button" onClick={() => setIsInstallOpen(true)}>
            安装 skill
          </button>
          <button className="secondary-button" onClick={() => void hydrate()}>
            重新扫描
          </button>
        </div>
      </section>

      {flash ? (
        <div className="flash flash-error" role="alert">
          <strong>{flash.message}</strong>
          {flash.details ? <p>{flash.details}</p> : null}
        </div>
      ) : null}

      <div className="stack">
        <OverviewCards skills={snapshot.skills} lastScannedAt={snapshot.lastScannedAt} />

        <div className="layout-grid">
          <div className="stack">
            <SkillTable
              skills={visibleSkills}
              projects={snapshot.projects}
              preferences={snapshot.uiPreferences}
              onPreferencesChange={(patch) => void updatePreferences(patch)}
              onSelectSkill={(skill) => void syncSelection(skill)}
              onDeleteSkill={(skill) => void handleDeleteSkill(skill)}
            />

            <ProjectPanel
              projects={snapshot.projects}
              onRefresh={() => void refreshProjects()}
              onAddProject={handleAddProject}
              onRemoveProject={handleRemoveProject}
            />
          </div>

          <SkillDetail
            skill={selectedSkill}
            manifest={manifest}
            onReload={() => void syncSelection(selectedSkill)}
          />
        </div>
      </div>

      {loading ? <div className="flash">正在加载 skill 清单...</div> : null}

      <InstallDialog
        isOpen={isInstallOpen}
        projects={snapshot.projects}
        onClose={() => setIsInstallOpen(false)}
        onInstallLocal={handleInstallLocal}
        onInstallGithub={handleInstallGithub}
      />
    </main>
  );
}
