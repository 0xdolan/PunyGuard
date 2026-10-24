/**
 * Sort and per-column filter logic for the character table, shared by the
 * extension and the Pages site so both behave identically.
 */
import { filterCharacters, type CharDetail } from './characters';

export type CharColumnKey =
  'index' | 'char' | 'uPlus' | 'name' | 'block' | 'script' | 'category' | 'decimal' | 'flags';

export interface CharColumn {
  key: CharColumnKey;
  label: string;
  /** Value used for sorting. */
  sortValue: (c: CharDetail) => number | string;
  /** Values a row offers to the column filter (a row can carry several flags). */
  filterValues: (c: CharDetail) => string[];
}

export type SortDir = 'asc' | 'desc';

export interface TableState {
  query: string;
  sort: { key: CharColumnKey; dir: SortDir } | null;
  /** Selected values per column; a row matches a column when it has any of them. */
  filters: Partial<Record<CharColumnKey, string[]>>;
}

export interface FacetOption {
  value: string;
  count: number;
}

export function charFlags(c: CharDetail): string[] {
  const flags: string[] = [];
  if (c.isHomoglyph) flags.push('Homoglyph');
  if (c.isInvisible) flags.push('Invisible');
  if (c.isControl && !c.isInvisible) flags.push('Control');
  flags.push(c.isNonAscii ? 'Non-ASCII' : 'ASCII');
  return flags;
}

export const CHAR_COLUMNS: CharColumn[] = [
  { key: 'index', label: '#', sortValue: (c) => c.index, filterValues: (c) => [String(c.index)] },
  { key: 'char', label: 'Char', sortValue: (c) => c.codePoint, filterValues: (c) => [c.display] },
  { key: 'uPlus', label: 'U+', sortValue: (c) => c.codePoint, filterValues: (c) => [c.uPlus] },
  { key: 'name', label: 'Name', sortValue: (c) => c.name, filterValues: (c) => [c.name] },
  { key: 'block', label: 'Block', sortValue: (c) => c.block, filterValues: (c) => [c.block] },
  { key: 'script', label: 'Script', sortValue: (c) => c.script, filterValues: (c) => [c.script] },
  {
    key: 'category',
    label: 'Category',
    sortValue: (c) => c.category,
    filterValues: (c) => [c.category],
  },
  {
    key: 'decimal',
    label: 'Dec',
    sortValue: (c) => c.decimal,
    filterValues: (c) => [String(c.decimal)],
  },
  {
    key: 'flags',
    label: 'Flags',
    sortValue: (c) => charFlags(c).join(' '),
    filterValues: charFlags,
  },
];

const COLUMN_BY_KEY = new Map(CHAR_COLUMNS.map((c) => [c.key, c]));

export function getColumn(key: CharColumnKey): CharColumn {
  return COLUMN_BY_KEY.get(key)!;
}

export const EMPTY_TABLE_STATE: TableState = { query: '', sort: null, filters: {} };

/** Distinct values for a column's filter menu, with how many rows carry each. */
export function facetOptions(chars: CharDetail[], key: CharColumnKey): FacetOption[] {
  const column = getColumn(key);
  const counts = new Map<string, number>();
  for (const c of chars) {
    for (const v of column.filterValues(c)) counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const numeric = key === 'index' || key === 'decimal';
  return [...counts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => (numeric ? Number(a.value) - Number(b.value) : a.value.localeCompare(b.value)));
}

export function activeFilterCount(state: TableState): number {
  return Object.values(state.filters).filter((v) => v && v.length > 0).length;
}

/** Global search, then column filters (OR within a column, AND across columns), then sort. */
export function applyTableState(chars: CharDetail[], state: TableState): CharDetail[] {
  let rows = filterCharacters(chars, state.query);

  for (const [key, selected] of Object.entries(state.filters) as [CharColumnKey, string[]][]) {
    if (!selected || selected.length === 0) continue;
    const wanted = new Set(selected);
    const column = getColumn(key);
    rows = rows.filter((c) => column.filterValues(c).some((v) => wanted.has(v)));
  }

  if (state.sort) {
    const { key, dir } = state.sort;
    const column = getColumn(key);
    const sign = dir === 'asc' ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const va = column.sortValue(a);
      const vb = column.sortValue(b);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb));
      return cmp * sign || a.index - b.index;
    });
  }
  return rows;
}

/** Next sort for a header click: ascending, then descending, then unsorted. */
export function nextSort(current: TableState['sort'], key: CharColumnKey): TableState['sort'] {
  if (!current || current.key !== key) return { key, dir: 'asc' };
  if (current.dir === 'asc') return { key, dir: 'desc' };
  return null;
}
