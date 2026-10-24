import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, ExternalLink, X } from 'lucide-react';
import {
  analyzeDomainCharacters,
  analyzeHostname,
  convertIdn,
  type CharDetail,
} from '@punyguard/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DomainSearch } from '@/components/DomainSearch';
import { CharDetails, CharDrawer } from '@/components/inspector/CharDetails';
import { CharTable } from '@/components/inspector/CharTable';
import { IdnCard } from '@/components/inspector/IdnCard';
import { ANALYZER_SITE, cn, openSiteInspector } from '@/lib/utils';

interface Props {
  initialDomain?: string;
  compact?: boolean;
  onOpenFull?: (domain: string) => void;
}

export function CharInspector({ initialDomain = '', compact = false, onOpenFull }: Props) {
  const [domain, setDomain] = useState(initialDomain);
  const [query, setQuery] = useState(initialDomain);
  const [selected, setSelected] = useState<number | null>(null);
  const [rows, setRows] = useState<CharDetail[]>([]);

  const report = useMemo(() => (query.trim() ? analyzeDomainCharacters(query) : null), [query]);
  const threat = useMemo(
    () => (report?.normalizedHost ? analyzeHostname(report.normalizedHost) : null),
    [report],
  );
  const idn = useMemo(
    () => (report?.normalizedHost ? convertIdn(report.normalizedHost) : null),
    [report],
  );
  const selectedChar = report?.characters.find((c) => c.index === selected) ?? null;
  const position = rows.findIndex((r) => r.index === selected);

  const step = useCallback(
    (delta: number) => {
      if (rows.length === 0) return;
      const next =
        rows[Math.max(0, Math.min(rows.length - 1, (position < 0 ? 0 : position) + delta))];
      if (next) setSelected(next.index);
    },
    [rows, position],
  );
  const close = useCallback(() => setSelected(null), []);
  const prev = useCallback(() => step(-1), [step]);
  const next = useCallback(() => step(1), [step]);

  function runCheck() {
    setQuery(domain.trim());
    setSelected(null);
  }

  return (
    <div className={cn('flex flex-col gap-4', compact && 'gap-3')}>
      <DomainSearch value={domain} onChange={setDomain} onSubmit={runCheck} />

      {report && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 flex-1 truncate font-mono text-sm font-medium">
              {report.normalizedHost}
            </p>
            {threat && (
              <Badge
                variant={
                  threat.level === 'danger'
                    ? 'danger'
                    : threat.level === 'watch'
                      ? 'warning'
                      : 'success'
                }
              >
                {threat.level} · {threat.score}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Chars" value={report.characters.length} />
            <Stat label="Non-ASCII" value={report.nonAsciiCount} tone="warning" />
            <Stat label="Homoglyphs" value={report.homoglyphCount} tone="danger" />
            <Stat label="Invisible" value={report.invisibleCount} tone="danger" />
          </div>

          {idn && <IdnCard idn={idn} threat={threat} compact={compact} />}

          {threat && threat.reasons.length > 0 && (
            <div className="flex gap-2 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              <div className="flex flex-col gap-1">
                {threat.reasons.map((r) => (
                  <span key={r}>{r}</span>
                ))}
              </div>
            </div>
          )}

          {/* Glyph strip */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap gap-1.5">
              {report.characters.map((c) => (
                <button
                  key={`${c.index}-${c.codePoint}`}
                  type="button"
                  onClick={() => setSelected(c.index)}
                  title={`${c.uPlus} ${c.name}`}
                  className={cn(
                    'flex size-9 cursor-pointer items-center justify-center rounded-md border font-glyph text-base transition-colors duration-200',
                    selected === c.index
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-background hover:bg-muted',
                    c.isHomoglyph && 'ring-1 ring-amber-500/60',
                    c.isInvisible && 'ring-1 ring-red-500/70',
                  )}
                >
                  {c.display}
                </button>
              ))}
            </div>
          </div>

          <CharTable
            chars={report.characters}
            selected={selected}
            onSelect={setSelected}
            onRowsChange={setRows}
            compact={compact}
          />

          {compact && selectedChar && (
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={close}
                  aria-label="Close details"
                >
                  <X />
                </Button>
              </div>
              <CharDetails char={selectedChar} />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {onOpenFull && (
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenFull(query)}>
                Open full analyzer
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => openSiteInspector(query)}
              title="Open on GitHub Pages"
            >
              <ExternalLink />
              Web inspector
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Deep reference also on{' '}
            <a className="text-primary underline-offset-2 hover:underline" href={ANALYZER_SITE}>
              the project site
            </a>
            . Notation uses formal <span className="font-mono">U+</span> code points.
          </p>

          {!compact && (
            <CharDrawer
              char={selectedChar}
              position={position}
              total={rows.length}
              onPrev={prev}
              onNext={next}
              onClose={close}
            />
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: 'warning' | 'danger';
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <div
        className={cn(
          'font-mono text-lg font-semibold tabular-nums',
          tone === 'danger' && value > 0 && 'text-red-500',
          tone === 'warning' && value > 0 && 'text-amber-500',
        )}
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
