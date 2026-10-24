import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Copy, Funnel, Search, X } from 'lucide-react';
import {
  CHAR_COLUMNS,
  EMPTY_TABLE_STATE,
  activeFilterCount,
  applyTableState,
  charFlags,
  facetOptions,
  formatCharListClipboard,
  getColumn,
  nextSort,
  type CharColumnKey,
  type CharDetail,
  type TableState,
} from '@punyguard/core';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props {
  chars: CharDetail[];
  selected: number | null;
  onSelect: (index: number) => void;
  /** Receives the visible rows in display order, for prev/next navigation. */
  onRowsChange?: (rows: CharDetail[]) => void;
  compact?: boolean;
}

/** Columns shown in the narrow popup, in this order; the full analyzer shows all of them. */
const COMPACT_COLUMNS: CharColumnKey[] = ['char', 'uPlus', 'flags', 'name'];

export function CharTable({ chars, selected, onSelect, onRowsChange, compact = false }: Props) {
  const [state, setState] = useState<TableState>(EMPTY_TABLE_STATE);
  const [openFilter, setOpenFilter] = useState<{ key: CharColumnKey; x: number; y: number } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const rows = useMemo(() => applyTableState(chars, state), [chars, state]);
  const columns = compact ? COMPACT_COLUMNS.map(getColumn) : CHAR_COLUMNS;
  const filtersOn = activeFilterCount(state) + (state.query.trim() ? 1 : 0);

  useEffect(() => onRowsChange?.(rows), [rows, onRowsChange]);
  useEffect(() => setState(EMPTY_TABLE_STATE), [chars]);

  function setFilter(key: CharColumnKey, values: string[]) {
    setState((s) => {
      const filters = { ...s.filters };
      if (values.length) filters[key] = values;
      else delete filters[key];
      return { ...s, filters };
    });
  }

  function toggleFilter(key: CharColumnKey, button: HTMLElement) {
    if (openFilter?.key === key) return setOpenFilter(null);
    const r = button.getBoundingClientRect();
    setOpenFilter({
      key,
      x: Math.max(8, Math.min(r.left, window.innerWidth - 248)),
      y: r.bottom + 6,
    });
  }

  async function copyRows() {
    await navigator.clipboard.writeText(formatCharListClipboard(rows));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <section aria-label="Characters" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={state.query}
            onChange={(e) => setState((s) => ({ ...s, query: e.target.value }))}
            placeholder="Search all columns"
            aria-label="Search all columns"
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {rows.length === chars.length
            ? `${chars.length} chars`
            : `${rows.length} of ${chars.length}`}
        </span>
        {filtersOn > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setState({ ...EMPTY_TABLE_STATE, sort: state.sort })}
          >
            <X />
            Clear {filtersOn === 1 ? 'filter' : `${filtersOn} filters`}
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => void copyRows()}>
          {copied ? <Check /> : <Copy />}
          Copy {rows.length === chars.length ? 'all' : rows.length}
        </Button>
      </div>

      <div
        onScroll={() => setOpenFilter(null)}
        className={cn(
          'overflow-auto rounded-xl border border-border',
          compact ? 'max-h-[260px]' : 'max-h-[60vh]',
        )}
      >
        <table
          className={cn('w-full border-collapse text-left text-xs', !compact && 'min-w-[820px]')}
        >
          <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
            <tr className="border-b border-border">
              {columns.map((col) => (
                <HeaderCell
                  key={col.key}
                  label={col.label}
                  sortDir={state.sort?.key === col.key ? state.sort.dir : null}
                  filterCount={state.filters[col.key]?.length ?? 0}
                  filterOpen={openFilter?.key === col.key}
                  onSort={() => setState((s) => ({ ...s, sort: nextSort(s.sort, col.key) }))}
                  onFilter={(el) => toggleFilter(col.key, el)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={`${c.index}-${c.codePoint}`}
                tabIndex={0}
                aria-selected={selected === c.index}
                onClick={() => onSelect(c.index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(c.index);
                  }
                }}
                className={cn(
                  'cursor-pointer border-b border-border/60 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted',
                  selected === c.index && 'bg-primary/5 shadow-[inset_3px_0_0_hsl(var(--primary))]',
                )}
              >
                {columns.map((col) => (
                  <Cell key={col.key} col={col.key} c={c} compact={compact} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-4 text-center text-sm text-muted-foreground">
            No characters match.{' '}
            <button
              type="button"
              className="cursor-pointer text-primary hover:underline"
              onClick={() => setState(EMPTY_TABLE_STATE)}
            >
              Clear search and filters
            </button>
          </p>
        )}
      </div>

      {openFilter && (
        <FilterMenu
          chars={chars}
          column={openFilter.key}
          x={openFilter.x}
          y={openFilter.y}
          selected={state.filters[openFilter.key] ?? []}
          onChange={(values) => setFilter(openFilter.key, values)}
          onClose={() => setOpenFilter(null)}
        />
      )}
    </section>
  );
}

function HeaderCell({
  label,
  sortDir,
  filterCount,
  filterOpen,
  onSort,
  onFilter,
}: {
  label: string;
  sortDir: 'asc' | 'desc' | null;
  filterCount: number;
  filterOpen: boolean;
  onSort: () => void;
  onFilter: (el: HTMLElement) => void;
}) {
  const SortIcon = sortDir === 'asc' ? ArrowUp : sortDir === 'desc' ? ArrowDown : ArrowUpDown;
  return (
    <th
      scope="col"
      aria-sort={sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'}
      className="px-1 py-1 font-semibold"
    >
      <div className="flex items-center gap-0.5 whitespace-nowrap">
        <button
          type="button"
          onClick={onSort}
          aria-label={`Sort by ${label}`}
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 rounded px-1 py-1 text-[10px] uppercase tracking-wide hover:bg-background/60',
            sortDir ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {label}
          <SortIcon className={cn('size-3', sortDir ? 'text-primary' : 'opacity-50')} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFilter(e.currentTarget);
          }}
          data-filter-trigger
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          aria-label={`Filter ${label}${filterCount ? ` (${filterCount} selected)` : ''}`}
          className={cn(
            'relative inline-flex size-5 cursor-pointer items-center justify-center rounded hover:bg-background/60',
            filterCount ? 'text-primary' : 'text-muted-foreground',
          )}
        >
          <Funnel className="size-3" />
          {filterCount > 0 && (
            <span className="absolute -right-1 -top-1 min-w-[15px] rounded-full bg-primary px-1 text-center text-[9px] font-bold leading-[15px] text-primary-foreground">
              {filterCount}
            </span>
          )}
        </button>
      </div>
    </th>
  );
}

function Cell({ col, c, compact }: { col: CharColumnKey; c: CharDetail; compact: boolean }) {
  switch (col) {
    case 'index':
      return <td className="px-2.5 py-2 font-mono text-muted-foreground">{c.index}</td>;
    case 'char':
      return <td className="px-2.5 py-2 font-glyph text-base">{c.display}</td>;
    case 'uPlus':
      return <td className="px-2.5 py-2 font-mono">{c.uPlus}</td>;
    case 'name':
      return (
        <td
          className={cn(
            'truncate whitespace-nowrap px-2.5 py-2 font-mono',
            compact ? 'max-w-[150px]' : 'max-w-[200px]',
          )}
          title={c.name}
        >
          {c.name}
        </td>
      );
    case 'block':
      return <td className="whitespace-nowrap px-2.5 py-2 text-muted-foreground">{c.block}</td>;
    case 'script':
      return <td className="whitespace-nowrap px-2.5 py-2 text-muted-foreground">{c.script}</td>;
    case 'category':
      return (
        <td className="px-2.5 py-2 font-mono" title={c.categoryLabel}>
          {c.category}
        </td>
      );
    case 'decimal':
      return <td className="px-2.5 py-2 font-mono tabular-nums">{c.decimal}</td>;
    case 'flags':
      return (
        <td className="px-2.5 py-2">
          <div className="flex gap-1">
            {charFlags(c).map((f) => (
              <FlagPill key={f} flag={f} />
            ))}
          </div>
        </td>
      );
  }
}

export function FlagPill({ flag }: { flag: string }) {
  return (
    <span
      className={cn(
        'whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium',
        flag === 'Homoglyph' && 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        (flag === 'Invisible' || flag === 'Control') &&
          'bg-red-500/15 text-red-600 dark:text-red-300',
        flag === 'Non-ASCII' && 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
        flag === 'ASCII' && 'bg-muted text-muted-foreground',
      )}
    >
      {flag}
    </span>
  );
}

function FilterMenu({
  chars,
  column,
  x,
  y,
  selected,
  onChange,
  onClose,
}: {
  chars: CharDetail[];
  column: CharColumnKey;
  x: number;
  y: number;
  selected: string[];
  onChange: (values: string[]) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const label = getColumn(column).label;
  const chosen = new Set(selected);
  const q = query.trim().toLowerCase();
  const options = facetOptions(chars, column).filter(
    (o) => !q || o.value.toLowerCase().includes(q),
  );

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      // Its own trigger toggles the menu, so let that click through.
      if (!ref.current?.contains(t) && !t.closest('[data-filter-trigger]')) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onClose);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={`Filter ${label}`}
      style={{ left: x, top: y }}
      className="fixed z-50 w-60 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-xl"
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Filter {label}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filter"
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground hover:bg-muted"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <label className="relative mb-2 block">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search values"
          aria-label={`Search ${label} values`}
          className="h-8 w-full rounded-md border border-border bg-background pl-7 pr-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </label>
      <div className="mb-1 flex items-center justify-between px-1 text-[11px]">
        <button
          type="button"
          className="cursor-pointer text-primary hover:underline"
          onClick={() => onChange([...new Set([...selected, ...options.map((o) => o.value)])])}
        >
          Select {q ? 'shown' : 'all'}
        </button>
        <button
          type="button"
          className="cursor-pointer text-muted-foreground hover:underline"
          onClick={() => onChange([])}
        >
          Clear
        </button>
      </div>
      <ul className="max-h-56 overflow-auto" aria-multiselectable="true" role="listbox">
        {options.length === 0 && (
          <li className="px-1.5 py-2 text-xs text-muted-foreground">No values match.</li>
        )}
        {options.map((o) => (
          <li key={o.value}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted">
              <input
                type="checkbox"
                checked={chosen.has(o.value)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.value]
                      : selected.filter((v) => v !== o.value),
                  )
                }
                className="size-3.5 accent-[hsl(var(--primary))]"
              />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  column === 'char' ? 'font-glyph text-sm' : 'font-mono',
                )}
                title={o.value}
              >
                {o.value}
              </span>
              <span className="tabular-nums text-muted-foreground">{o.count}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
