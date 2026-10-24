import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, ExternalLink, EyeOff } from 'lucide-react';
import {
  analyzeDomainCharacters,
  analyzeHostname,
  convertIdn,
  filterCharacters,
  formatCharListClipboard,
  type CharDetail,
} from '@punyguard/core';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DomainSearch } from '@/components/DomainSearch';
import { ANALYZER_SITE, cn, openSiteInspector } from '@/lib/utils';

interface Props {
  initialDomain?: string;
  compact?: boolean;
  onOpenFull?: (domain: string) => void;
}

export function CharInspector({ initialDomain = '', compact = false, onOpenFull }: Props) {
  const [domain, setDomain] = useState(initialDomain);
  const [query, setQuery] = useState(initialDomain);
  const [charFilter, setCharFilter] = useState('');
  const [selected, setSelected] = useState<CharDetail | null>(null);
  const [copied, setCopied] = useState(false);

  const report = useMemo(() => (query.trim() ? analyzeDomainCharacters(query) : null), [query]);
  const threat = useMemo(
    () => (report?.normalizedHost ? analyzeHostname(report.normalizedHost) : null),
    [report],
  );
  const idn = useMemo(
    () => (report?.normalizedHost ? convertIdn(report.normalizedHost) : null),
    [report],
  );
  const chars = useMemo(
    () => (report ? filterCharacters(report.characters, charFilter) : []),
    [report, charFilter],
  );

  function runCheck() {
    setQuery(domain.trim());
    setSelected(null);
  }

  async function copyList() {
    if (!report) return;
    await navigator.clipboard.writeText(formatCharListClipboard(report.characters));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

          {idn && (
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  IDN · Punycode (UTS #46)
                </h3>
                <Badge variant={idn.hasIdn ? 'warning' : 'success'}>
                  {idn.direction === 'identity' ? 'ASCII' : idn.direction}
                </Badge>
              </div>
              <dl className="flex flex-col gap-1.5 font-mono text-xs">
                <div className="grid grid-cols-[72px_1fr] gap-2">
                  <dt className="text-muted-foreground">Unicode</dt>
                  <dd className="break-all">{idn.unicode || '—'}</dd>
                </div>
                <div className="grid grid-cols-[72px_1fr] gap-2">
                  <dt className="text-muted-foreground">ACE</dt>
                  <dd className="break-all">{idn.ascii || '—'}</dd>
                </div>
              </dl>
              {idn.labels.some((l) => l.changed) && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-border pt-2 text-[11px]">
                  {idn.labels
                    .filter((l) => l.changed)
                    .map((l) => (
                      <li key={l.input} className="font-mono text-muted-foreground">
                        <span className="text-foreground">{l.input}</span>
                        {' → '}
                        <span className="text-foreground">{l.output}</span>
                        {l.isAce ? ' · xn--' : ''}
                      </li>
                    ))}
                </ul>
              )}
              {idn.errors.length > 0 && (
                <p className="mt-2 text-[11px] text-red-500">{idn.errors[0]}</p>
              )}
            </div>
          )}

          {/* Glyph strip */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card p-3">
            <div className="flex flex-wrap gap-1.5">
              {report.characters.map((c) => (
                <button
                  key={`${c.index}-${c.codePoint}`}
                  type="button"
                  onClick={() => setSelected(c)}
                  title={`${c.uPlus} ${c.name}`}
                  className={cn(
                    'flex size-9 cursor-pointer items-center justify-center rounded-md border font-glyph text-base transition-colors duration-200',
                    selected?.index === c.index
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

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              value={charFilter}
              onChange={(e) => setCharFilter(e.target.value)}
              placeholder="Search name, U+, hex, dec, block…"
              className="h-9"
              aria-label="Filter characters"
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void copyList()}>
                {copied ? <Check /> : <Copy />}
                Copy list
              </Button>
              {onOpenFull && (
                <Button type="button" variant="outline" size="sm" onClick={() => onOpenFull(query)}>
                  Details
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
                Web
              </Button>
            </div>
          </div>

          <div
            className={cn(
              'grid gap-3',
              !compact && selected ? 'lg:grid-cols-[1fr_320px]' : 'grid-cols-1',
            )}
          >
            <div className="max-h-[280px] overflow-auto rounded-xl border border-border">
              <table className="w-full min-w-[520px] border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-muted/95 backdrop-blur">
                  <tr className="border-b border-border text-[10px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Char</th>
                    <th className="px-3 py-2 font-medium">U+</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Block</th>
                    <th className="px-3 py-2 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {chars.map((c) => (
                    <tr
                      key={`${c.index}-${c.uPlus}`}
                      className={cn(
                        'cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50',
                        selected?.index === c.index && 'bg-primary/5',
                      )}
                      onClick={() => setSelected(c)}
                    >
                      <td className="px-3 py-2 font-mono text-muted-foreground">{c.index}</td>
                      <td className="px-3 py-2 font-glyph text-base">{c.display}</td>
                      <td className="px-3 py-2 font-mono">{c.uPlus}</td>
                      <td className="max-w-[180px] truncate px-3 py-2 font-mono" title={c.name}>
                        {c.name}
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2 text-muted-foreground">
                        {c.block}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1">
                          {c.isHomoglyph && <Badge variant="warning">homo</Badge>}
                          {c.isInvisible && (
                            <Badge variant="danger">
                              <EyeOff className="mr-0.5 size-3" />
                              inv
                            </Badge>
                          )}
                          {c.isNonAscii && !c.isHomoglyph && !c.isInvisible && (
                            <Badge variant="secondary">idn</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {chars.length === 0 && (
                <p className="p-4 text-center text-sm text-muted-foreground">No matches.</p>
              )}
            </div>

            {selected && !compact && <CharDetailPanel char={selected} />}
          </div>

          {selected && compact && <CharDetailPanel char={selected} />}

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

          <p className="text-[11px] text-muted-foreground">
            Deep reference also on{' '}
            <a className="text-primary underline-offset-2 hover:underline" href={ANALYZER_SITE}>
              the project site
            </a>
            . Notation uses formal <span className="font-mono">U+</span> code points.
          </p>
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

function CharDetailPanel({ char }: { char: CharDetail }) {
  const rows: Array<[string, string]> = [
    ['Formal name', char.name],
    ['Code point', char.uPlus],
    ['Hex', `0x${char.hexPadded}`],
    ['Decimal', String(char.decimal)],
    ['Unicode block', char.block],
    ['Script group', char.script],
    ['General category', `${char.category} — ${char.categoryLabel}`],
    ['Combining class', String(char.combiningClass)],
    ['Bidi', char.bidiClass],
    ['As text', char.isInvisible ? '(invisible)' : char.char],
    ['HTML escape', char.htmlEscape],
    ['URL escape', char.urlEscape],
    ['JS escape', char.jsEscape],
    ['UTF-8', char.utf8Hex],
    ['UTF-16', char.utf16Hex],
  ];
  if (char.isHomoglyph && char.homoglyphLatin) {
    rows.push(['Homoglyph → Latin', char.homoglyphLatin]);
  }

  return (
    <aside className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex size-14 items-center justify-center rounded-xl border border-border bg-background font-glyph text-3xl">
          {char.display}
        </div>
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold">{char.uPlus}</p>
          <p className="truncate text-xs text-muted-foreground" title={char.name}>
            {char.name}
          </p>
        </div>
      </div>
      <dl className="flex flex-col gap-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[110px_1fr] gap-2">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="break-all font-mono">{v}</dd>
          </div>
        ))}
      </dl>
      <a
        className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-primary hover:underline"
        href={char.unicodeOrgUrl}
        target="_blank"
        rel="noreferrer"
      >
        Unicode character page <ExternalLink className="size-3" />
      </a>
    </aside>
  );
}
