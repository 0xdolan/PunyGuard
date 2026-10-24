import { describe, expect, it } from 'vitest';
import {
  CHAR_COLUMNS,
  EMPTY_TABLE_STATE,
  activeFilterCount,
  analyzeDomainCharacters,
  applyTableState,
  charFlags,
  facetOptions,
  nextSort,
  type TableState,
} from '@punyguard/core';

// "аmаzоn.com" with Cyrillic а (U+0430) twice and Cyrillic о (U+043E).
const chars = analyzeDomainCharacters('аmаzоn.com').characters;
const state = (patch: Partial<TableState>): TableState => ({ ...EMPTY_TABLE_STATE, ...patch });
const idx = (rows: { index: number }[]) => rows.map((r) => r.index);

describe('character table', () => {
  it('offers a filter and sort for every column', () => {
    expect(CHAR_COLUMNS.map((c) => c.key)).toEqual([
      'index',
      'char',
      'uPlus',
      'name',
      'block',
      'script',
      'category',
      'decimal',
      'flags',
    ]);
  });

  it('builds filter options with counts', () => {
    expect(facetOptions(chars, 'block')).toEqual([
      { value: 'Basic Latin', count: 7 },
      { value: 'Cyrillic', count: 3 },
    ]);
    expect(facetOptions(chars, 'uPlus').find((o) => o.value === 'U+0430')?.count).toBe(2);
  });

  it('orders numeric filter options numerically', () => {
    const values = facetOptions(chars, 'decimal').map((o) => Number(o.value));
    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('matches any selected value within one column', () => {
    const rows = applyTableState(chars, state({ filters: { uPlus: ['U+0430', 'U+043E'] } }));
    expect(idx(rows)).toEqual([0, 2, 4]);
  });

  it('requires every filtered column to match', () => {
    const rows = applyTableState(
      chars,
      state({ filters: { block: ['Cyrillic'], name: ['CYRILLIC SMALL LETTER O'] } }),
    );
    expect(idx(rows)).toEqual([4]);
  });

  it('filters by flags, including rows with several flags', () => {
    expect(charFlags(chars[0]!)).toEqual(['Homoglyph', 'Non-ASCII']);
    expect(idx(applyTableState(chars, state({ filters: { flags: ['Homoglyph'] } })))).toEqual([
      0, 2, 4,
    ]);
  });

  it('combines global search with column filters', () => {
    const rows = applyTableState(chars, state({ query: 'latin', filters: { category: ['Ll'] } }));
    expect(rows.every((r) => r.block === 'Basic Latin' && r.category === 'Ll')).toBe(true);
    expect(rows.length).toBe(6);
  });

  it('sorts numbers numerically and keeps ties in original order', () => {
    const asc = applyTableState(chars, state({ sort: { key: 'decimal', dir: 'asc' } }));
    expect(asc[0]!.char).toBe('.');
    const desc = applyTableState(chars, state({ sort: { key: 'uPlus', dir: 'desc' } }));
    expect(idx(desc.slice(0, 3))).toEqual([4, 0, 2]);
  });

  it('sorts text columns alphabetically', () => {
    const rows = applyTableState(chars, state({ sort: { key: 'block', dir: 'asc' } }));
    expect(rows.at(-1)!.block).toBe('Cyrillic');
  });

  it('cycles sort ascending, descending, then off', () => {
    const a = nextSort(null, 'name');
    expect(a).toEqual({ key: 'name', dir: 'asc' });
    const d = nextSort(a, 'name');
    expect(d).toEqual({ key: 'name', dir: 'desc' });
    expect(nextSort(d, 'name')).toBeNull();
    expect(nextSort(d, 'block')).toEqual({ key: 'block', dir: 'asc' });
  });

  it('counts active column filters, ignoring empty selections', () => {
    expect(activeFilterCount(state({ filters: { block: ['Cyrillic'], name: [] } }))).toBe(1);
  });

  it('does not mutate the input when sorting', () => {
    const before = idx(chars);
    applyTableState(chars, state({ sort: { key: 'decimal', dir: 'desc' } }));
    expect(idx(chars)).toEqual(before);
  });
});
