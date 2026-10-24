import { useMemo } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';
import { CharInspector } from '@/components/CharInspector';
import { Button } from '@/components/ui/button';
import { getSettings } from '@/lib/storage';
import { applyTheme } from '@/lib/theme';
import { SITE_URL } from '@/lib/utils';
import { useEffect, useState } from 'react';

function readDomainParam(): string {
  const q = new URLSearchParams(location.search);
  return q.get('domain') ?? '';
}

export default function App() {
  const initial = useMemo(() => readDomainParam(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void getSettings().then((s) => {
      applyTheme(s.theme);
      setReady(true);
    });
  }, []);

  if (!ready) return null;

  return (
    <div className="drawer-shift min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Back"
            onClick={() => history.back()}
          >
            <ArrowLeft />
          </Button>
          <img src="/icons/icon-32.png" alt="" width={28} height={28} />
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold tracking-tight">Unicode Analyzer</h1>
            <p className="text-xs text-muted-foreground">
              Per-character U+, block, script, category, escapes · local-only
            </p>
          </div>
          <a
            href={SITE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Shield className="size-3.5" />
            Project site
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <CharInspector initialDomain={initial} />
      </main>
    </div>
  );
}
