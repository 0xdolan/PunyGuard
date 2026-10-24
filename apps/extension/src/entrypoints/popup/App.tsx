import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ExternalLink, Settings2 } from 'lucide-react';
import type { ScanResult } from '@punyguard/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getSettings, saveSettings, type PunyGuardSettings } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';
import { openAnalyzer, REPO_URL, SITE_URL } from '@/lib/utils';

const CharInspector = lazy(() =>
  import('@/components/CharInspector').then((m) => ({ default: m.CharInspector })),
);

type Tab = 'page' | 'inspect';

export default function App() {
  const [settings, setSettings] = useState<PunyGuardSettings | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('page');
  const [seedDomain, setSeedDomain] = useState('');

  useEffect(() => {
    void (async () => {
      const s = await getSettings();
      setSettings(s);
      applyTheme(s.theme);
      const [active] = await browser.tabs.query({ active: true, currentWindow: true });
      const response = (await browser.runtime.sendMessage({
        type: 'GET_SCAN',
        tabId: active?.id,
      })) as { result: ScanResult | null };
      setResult(response?.result ?? null);
      if (active?.url) {
        try {
          setSeedDomain(new URL(active.url).hostname);
        } catch {
          /* ignore */
        }
      }
      setLoading(false);
    })();
  }, []);

  const visible = useMemo(() => {
    if (!result) return [];
    if (settings?.showSafeDomains) return result.threats;
    return result.threats.filter((t) => t.level !== 'safe');
  }, [result, settings]);

  async function toggleEnabled(enabled: boolean) {
    if (!settings) return;
    const next = await saveSettings({ enabled });
    setSettings(next);
    await browser.runtime.sendMessage({ type: 'TOGGLE_ENABLED', enabled });
  }

  return (
    <div className="popup-shell flex flex-col bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src="/icons/icon-32.png" alt="" width={28} height={28} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-extrabold tracking-tight">PunyGuard</h1>
          <p className="truncate font-mono text-[11px] text-muted-foreground">
            {result?.pageHost ?? 'No active page'}
          </p>
        </div>
        <Switch
          checked={settings?.enabled ?? true}
          onCheckedChange={(v) => void toggleEnabled(v)}
          aria-label="Enable PunyGuard"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Open settings"
          onClick={() => void browser.runtime.openOptionsPage()}
        >
          <Settings2 />
        </Button>
      </header>

      <div className="flex gap-1 px-4 pt-3">
        <TabBtn active={tab === 'page'} onClick={() => setTab('page')}>
          Page
        </TabBtn>
        <TabBtn active={tab === 'inspect'} onClick={() => setTab('inspect')}>
          Inspect
        </TabBtn>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {tab === 'page' ? (
          <PageTab
            loading={loading}
            enabled={settings?.enabled ?? true}
            result={result}
            visible={visible}
            onInspect={(d) => {
              setSeedDomain(d);
              setTab('inspect');
            }}
          />
        ) : (
          <Suspense
            fallback={
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Loading inspector…
              </div>
            }
          >
            <CharInspector initialDomain={seedDomain} compact onOpenFull={(d) => openAnalyzer(d)} />
          </Suspense>
        )}
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-1.5 gap-y-1 border-t border-border px-4 py-2.5 text-center text-[11px] text-muted-foreground">
        <span>
          Made <span className="text-primary">♥</span> by{' '}
          <a
            className="font-medium text-foreground hover:underline"
            href="https://github.com/0xdolan"
            target="_blank"
            rel="noreferrer"
          >
            0xdolan
          </a>
        </span>
        <span aria-hidden>·</span>
        <a className="hover:underline" href={REPO_URL} target="_blank" rel="noreferrer">
          Source
        </a>
        <span aria-hidden>·</span>
        <a
          className="inline-flex items-center gap-0.5 hover:underline"
          href={SITE_URL}
          target="_blank"
          rel="noreferrer"
        >
          Site <ExternalLink className="size-3" />
        </a>
        <span aria-hidden>·</span>
        <span className="font-mono">v0.0.2</span>
      </footer>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 flex-1 cursor-pointer rounded-lg text-xs font-semibold transition-colors duration-200 ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function PageTab({
  loading,
  enabled,
  result,
  visible,
  onInspect,
}: {
  loading: boolean;
  enabled: boolean;
  result: ScanResult | null;
  visible: ScanResult['threats'];
  onInspect: (domain: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Scanning…
      </div>
    );
  }
  if (!enabled) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
        Protection is off. Enable the toggle to scan pages for lookalike and phishing domains.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        <Metric label="Risk" value={result?.counts.danger ?? 0} tone="text-red-500" />
        <Metric label="Watch" value={result?.counts.watch ?? 0} tone="text-amber-500" />
        <Metric label="Clear" value={result?.counts.safe ?? 0} tone="text-emerald-500" />
      </div>
      {result?.durationMs != null && (
        <p className="text-center font-mono text-[10px] text-muted-foreground">
          {result.durationMs.toFixed(1)} ms · local-only
        </p>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Page domains
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">{visible.length}</span>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No risky or IDN lookalike domains on this page.
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onInspect(result?.pageHost ?? '')}
            >
              Inspect a domain
            </Button>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((t) => (
            <li key={t.hostname}>
              <button
                type="button"
                onClick={() => onInspect(t.hostname)}
                className="flex w-full cursor-pointer flex-col gap-1 rounded-xl border border-border bg-card px-3 py-2.5 text-left transition-colors duration-200 hover:bg-muted/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="truncate font-mono text-sm font-semibold"
                    title={t.unicodeHostname}
                  >
                    {t.unicodeHostname}
                  </span>
                  <Badge
                    variant={
                      t.level === 'danger' ? 'danger' : t.level === 'watch' ? 'warning' : 'success'
                    }
                  >
                    {t.level}
                  </Badge>
                </div>
                <span className="line-clamp-2 text-[11px] text-muted-foreground">
                  {t.reasons[0]}
                  {t.score > 0 ? ` · score ${t.score}` : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-2 py-2 text-center">
      <div className={`font-mono text-lg font-bold tabular-nums ${tone}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
