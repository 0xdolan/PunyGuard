import { useEffect, useState } from 'react';
import { ExternalLink, Moon, Sun, Monitor } from 'lucide-react';
import { DEFAULT_SETTINGS, getSettings, saveSettings, type PunyGuardSettings } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { openAnalyzer, SITE_URL, REPO_URL } from '@/lib/utils';

export default function App() {
  const [settings, setSettings] = useState<PunyGuardSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getSettings().then((s) => {
      setSettings(s);
      applyTheme(s.theme);
    });
  }, []);

  async function update<K extends keyof PunyGuardSettings>(key: K, value: PunyGuardSettings[K]) {
    const next = await saveSettings({ [key]: value });
    setSettings(next);
    applyTheme(next.theme);
    await browser.runtime.sendMessage({ type: 'SETTINGS_UPDATED', settings: next });
    if (key === 'enabled') {
      await browser.runtime.sendMessage({ type: 'TOGGLE_ENABLED', enabled: next.enabled });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <img src="/icon-48.png" alt="PunyGuard" width={48} height={48} />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Local phishing & IDN lookalike protection
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Row
            title="Enable protection"
            description="Master switch for live scanning and badge alerts."
          >
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => void update('enabled', v)}
              aria-label="Enable protection"
            />
          </Row>

          <Row title="Theme" description="Light, dark, or match your system.">
            <div className="flex gap-1 rounded-lg border border-border p-1">
              {(
                [
                  ['system', Monitor],
                  ['light', Sun],
                  ['dark', Moon],
                ] as const
              ).map(([value, Icon]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => void update('theme', value)}
                  className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors duration-200 ${
                    settings.theme === value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                  aria-label={value}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
          </Row>

          <Row
            title="Show safe domains"
            description="Include low-risk domains in the popup page list."
          >
            <Switch
              checked={settings.showSafeDomains}
              onCheckedChange={(v) => void update('showSafeDomains', v)}
              aria-label="Show safe domains"
            />
          </Row>

          <Row title="Scan iframes" description="Analyze third-party frames embedded in the page.">
            <Switch
              checked={settings.scanIframes}
              onCheckedChange={(v) => void update('scanIframes', v)}
              aria-label="Scan iframes"
            />
          </Row>

          <Row
            title="Toolbar badge"
            description="Show green / amber / red threat counts on the icon."
          >
            <Switch
              checked={settings.badgeEnabled}
              onCheckedChange={(v) => void update('badgeEnabled', v)}
              aria-label="Toolbar badge"
            />
          </Row>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => openAnalyzer()}>
            Open analyzer
          </Button>
          <Button type="button" variant="outline" onClick={() => window.open(SITE_URL, '_blank')}>
            <ExternalLink />
            Project site
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.open(REPO_URL, '_blank')}>
            Source
          </Button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {saved ? 'Saved.' : 'Changes sync via browser storage.'} · v0.0.2 · GPL-3.0
        </p>
      </div>
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3.5">
      <div className="min-w-0">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
