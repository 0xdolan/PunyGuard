import {
  CHAR_COLUMNS,
  EMPTY_TABLE_STATE,
  activeFilterCount,
  analyzeDomainCharacters,
  analyzeHostname,
  applyTableState,
  charFlags,
  convertIdn,
  facetOptions,
  formatCharListClipboard,
  getColumn,
  nextSort,
  type CharColumnKey,
  type CharDetail,
  type DomainThreat,
  type IdnConversion,
  type TableState,
} from '@punyguard/core';

// Lucide icon paths (ISC license), inlined because the site ships no icon library.
const ICONS = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  funnel:
    '<path d="M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z"/>',
  sort: '<path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/>',
  asc: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  desc: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  up: '<path d="m18 15-6-6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  external:
    '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  shieldAlert:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  shieldCheck:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
} as const;

function icon(name: keyof typeof ICONS, cls = 'size-3.5') {
  return `<svg class="${cls} shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const TONES = {
  danger: {
    ring: 'border-red-500/60',
    glow: 'from-red-500/15',
    pill: 'bg-red-500/15 text-red-300',
  },
  watch: {
    ring: 'border-amber-500/60',
    glow: 'from-amber-500/15',
    pill: 'bg-amber-500/15 text-amber-300',
  },
  safe: {
    ring: 'border-emerald-500/50',
    glow: 'from-emerald-500/10',
    pill: 'bg-emerald-500/15 text-emerald-300',
  },
};

// Listeners on document/window belong to the current report; a new report aborts them.
let mounted: AbortController | null = null;

/** Render the full report for `raw` into `root` and wire up its interactions. */
export function mountInspector(root: HTMLElement, raw: string) {
  mounted?.abort();
  mounted = new AbortController();
  document.documentElement.classList.remove('drawer-open');
  const { signal } = mounted;
  const report = analyzeDomainCharacters(raw);
  const threat = report.normalizedHost ? analyzeHostname(report.normalizedHost) : null;
  const idn = report.normalizedHost ? convertIdn(report.normalizedHost) : null;
  const chars = report.characters;

  let state: TableState = { ...EMPTY_TABLE_STATE, filters: {} };
  let rows = chars;
  let selected: number | null = null;

  root.innerHTML = `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="font-mono text-lg font-semibold break-all">${esc(report.normalizedHost ?? raw)}</h2>
        ${threat ? `<span class="rounded-md px-2 py-0.5 text-xs font-semibold ${TONES[threat.level].pill}">${threat.level} · ${threat.score}</span>` : ''}
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        ${stat('Chars', chars.length)}
        ${stat('Non-ASCII', report.nonAsciiCount, 'text-amber-400')}
        ${stat('Homoglyphs', report.homoglyphCount, 'text-red-400')}
        ${stat('Invisible', report.invisibleCount, 'text-red-400')}
      </div>
      ${idn ? idnCard(idn, threat) : ''}
      ${threat && threat.reasons.length ? reasons(threat) : ''}
      <div class="flex flex-wrap gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3" id="glyph-strip">
        ${chars
          .map(
            (c) =>
              `<button type="button" data-idx="${c.index}" class="font-glyph size-9 cursor-pointer rounded-md border border-[var(--border)] bg-[var(--bg)] text-base hover:border-[var(--ember)] ${c.isInvisible ? 'ring-1 ring-red-500/70' : ''} ${c.isHomoglyph ? 'ring-1 ring-amber-500/60' : ''}" title="${esc(c.uPlus + ' ' + c.name)}">${esc(c.display)}</button>`,
          )
          .join('')}
      </div>

      <section aria-label="Characters" class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <label class="relative min-w-[220px] flex-1">
            <span class="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--muted)]">${icon('search', 'size-4')}</span>
            <input id="char-search" type="search" class="font-mono h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ember)]" placeholder="Search all columns: name, U+, hex, dec, block, script" aria-label="Search all columns" />
          </label>
          <span id="row-count" class="text-xs tabular-nums text-[var(--muted)]"></span>
          <button id="clear-filters" type="button" class="hidden h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm hover:bg-white/5">${icon('x')}<span></span></button>
          <button id="copy-rows" type="button" class="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-xl border border-[var(--border)] px-3 text-sm hover:bg-white/5">${icon('copy')}<span>Copy rows</span></button>
        </div>
        <div id="table-wrap" class="max-h-[65vh] overflow-auto rounded-xl border border-[var(--border)]">
          <table class="w-full min-w-[860px] border-collapse text-left text-xs" id="char-table">
            <thead class="sticky top-0 z-[1] bg-[var(--card)]">
              <tr>${CHAR_COLUMNS.map((col) => `<th scope="col" data-key="${col.key}" class="border-b border-[var(--border)] px-1 py-1.5 align-middle font-semibold"></th>`).join('')}</tr>
            </thead>
            <tbody id="char-tbody"></tbody>
          </table>
          <p id="no-rows" class="hidden p-6 text-center text-sm text-[var(--muted)]">No characters match. <button type="button" class="cursor-pointer text-[var(--ember)] hover:underline" data-action="reset">Clear search and filters</button></p>
        </div>
      </section>
    </div>

    <div id="drawer-backdrop" class="fixed inset-0 z-30 hidden bg-black/50 lg:bg-transparent lg:pointer-events-none"></div>
    <aside id="drawer" role="dialog" aria-modal="false" aria-labelledby="drawer-title" class="fixed inset-y-0 right-0 z-40 hidden w-full max-w-[420px] translate-x-full flex-col border-l border-[var(--border)] bg-[var(--card)] shadow-2xl shadow-black/60 transition-transform duration-200 ease-out" inert></aside>
    <div id="filter-pop" class="fixed z-50 hidden w-64 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-2xl shadow-black/60" role="dialog" aria-label="Column filter"></div>`;

  const $ = <T extends Element>(sel: string) => root.querySelector<T>(sel)!;
  const tbody = $<HTMLElement>('#char-tbody');
  const thead = $<HTMLElement>('#char-table thead tr');
  const search = $<HTMLInputElement>('#char-search');
  const rowCount = $('#row-count');
  const clearBtn = $<HTMLButtonElement>('#clear-filters');
  const copyBtn = $<HTMLButtonElement>('#copy-rows');
  const noRows = $('#no-rows');
  const wrap = $('#table-wrap');
  const drawer = $<HTMLElement>('#drawer');
  const backdrop = $<HTMLElement>('#drawer-backdrop');
  const pop = $<HTMLElement>('#filter-pop');
  let openFilter: CharColumnKey | null = null;
  let popQuery = '';

  // ---------- table ----------
  function paintHeader() {
    thead.querySelectorAll<HTMLTableCellElement>('th').forEach((th) => {
      const key = th.dataset.key as CharColumnKey;
      const col = getColumn(key);
      const dir = state.sort?.key === key ? state.sort.dir : null;
      const selectedCount = state.filters[key]?.length ?? 0;
      th.setAttribute(
        'aria-sort',
        dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none',
      );
      th.innerHTML = `<div class="flex items-center gap-0.5 whitespace-nowrap">
        <button type="button" data-sort="${key}" class="inline-flex cursor-pointer items-center gap-1 rounded-md px-1 py-1 text-[11px] uppercase tracking-wide ${dir ? 'text-white' : 'text-[var(--muted)]'} hover:bg-white/5 hover:text-white" aria-label="Sort by ${esc(col.label)}${dir ? `, currently ${dir === 'asc' ? 'ascending' : 'descending'}` : ''}">
          ${esc(col.label)}${icon(dir === 'asc' ? 'asc' : dir === 'desc' ? 'desc' : 'sort', `size-3 ${dir ? 'text-[var(--ember)]' : 'opacity-50'}`)}
        </button>
        <button type="button" data-filter="${key}" aria-haspopup="dialog" aria-expanded="${openFilter === key}" class="relative inline-flex size-5 cursor-pointer items-center justify-center rounded-md hover:bg-white/5 ${selectedCount ? 'text-[var(--ember)]' : 'text-[var(--muted)] hover:text-white'}" aria-label="Filter ${esc(col.label)}${selectedCount ? ` (${selectedCount} selected)` : ''}">
          ${icon('funnel', 'size-3')}
          ${selectedCount ? `<span class="absolute -right-1 -top-1 min-w-[15px] rounded-full bg-[var(--ember)] px-1 text-center text-[9px] font-bold leading-[15px] text-white">${selectedCount}</span>` : ''}
        </button>
      </div>`;
    });
  }

  function paintRows() {
    rows = applyTableState(chars, state);
    tbody.innerHTML = rows.map(rowHtml).join('');
    noRows.classList.toggle('hidden', rows.length > 0);
    rowCount.textContent =
      rows.length === chars.length
        ? `${chars.length} characters`
        : `${rows.length} of ${chars.length}`;
    const n = activeFilterCount(state) + (state.query.trim() ? 1 : 0);
    clearBtn.classList.toggle('hidden', n === 0);
    clearBtn.classList.toggle('inline-flex', n > 0);
    clearBtn.querySelector('span')!.textContent = `Clear ${n === 1 ? 'filter' : `${n} filters`}`;
    copyBtn.querySelector('span')!.textContent =
      `Copy ${rows.length === chars.length ? 'all' : rows.length} rows`;
    const c = selected === null ? undefined : chars.find((x) => x.index === selected);
    if (c) drawer.innerHTML = drawerHtml(c, rows);
  }

  function rowHtml(c: CharDetail) {
    const sel = c.index === selected;
    return `<tr data-idx="${c.index}" aria-selected="${sel}" tabindex="0" class="cursor-pointer border-t border-[var(--border)] outline-none hover:bg-white/5 focus-visible:bg-white/10 ${sel ? 'bg-[var(--ember)]/10 shadow-[inset_3px_0_0_var(--ember)]' : ''}">
      <td class="font-mono px-2.5 py-2 text-[var(--muted)]">${c.index}</td>
      <td class="font-glyph px-2.5 py-2 text-base">${esc(c.display)}</td>
      <td class="font-mono px-2.5 py-2">${c.uPlus}</td>
      <td class="font-mono whitespace-nowrap px-2.5 py-2">${esc(c.name)}</td>
      <td class="px-2.5 py-2 text-[var(--muted)]">${esc(c.block)}</td>
      <td class="px-2.5 py-2 text-[var(--muted)]">${esc(c.script)}</td>
      <td class="font-mono px-2.5 py-2" title="${esc(c.categoryLabel)}">${c.category}</td>
      <td class="font-mono px-2.5 py-2 tabular-nums">${c.decimal}</td>
      <td class="px-2.5 py-2"><div class="flex gap-1">${charFlags(c).map(flagPill).join('')}</div></td>
    </tr>`;
  }

  function update() {
    paintHeader();
    paintRows();
    if (openFilter) paintPop();
  }

  // ---------- column filter popover ----------
  function paintPop() {
    if (!openFilter) return;
    const key = openFilter;
    const col = getColumn(key);
    const chosen = new Set(state.filters[key] ?? []);
    const q = popQuery.trim().toLowerCase();
    const options = facetOptions(chars, key).filter((o) => !q || o.value.toLowerCase().includes(q));
    pop.innerHTML = `
      <div class="mb-2 flex items-center justify-between px-1">
        <span class="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Filter ${esc(col.label)}</span>
        <button type="button" data-pop="close" class="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] hover:bg-white/5 hover:text-white" aria-label="Close filter">${icon('x')}</button>
      </div>
      <label class="relative mb-2 block">
        <span class="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[var(--muted)]">${icon('search', 'size-3.5')}</span>
        <input data-pop="search" type="search" value="${esc(popQuery)}" class="font-mono h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pl-8 pr-2 text-xs outline-none focus:ring-2 focus:ring-[var(--ember)]" placeholder="Search values" aria-label="Search ${esc(col.label)} values" />
      </label>
      <div class="mb-1 flex items-center justify-between px-1 text-[11px]">
        <button type="button" data-pop="all" class="cursor-pointer text-[var(--ember)] hover:underline">Select ${q ? 'shown' : 'all'}</button>
        <button type="button" data-pop="none" class="cursor-pointer text-[var(--muted)] hover:text-white hover:underline">Clear</button>
      </div>
      <ul class="max-h-60 overflow-auto" role="listbox" aria-multiselectable="true">
        ${
          options.length
            ? options
                .map(
                  (
                    o,
                  ) => `<li><label class="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-white/5">
              <input type="checkbox" data-value="${esc(o.value)}" ${chosen.has(o.value) ? 'checked' : ''} class="size-3.5 accent-[var(--ember)]" />
              <span class="${key === 'char' ? 'font-glyph text-sm' : 'font-mono'} min-w-0 flex-1 truncate" title="${esc(o.value)}">${esc(o.value)}</span>
              <span class="tabular-nums text-[var(--muted)]">${o.count}</span>
            </label></li>`,
                )
                .join('')
            : '<li class="px-1.5 py-2 text-xs text-[var(--muted)]">No values match.</li>'
        }
      </ul>`;
  }

  function placePop(anchor: HTMLElement) {
    const r = anchor.getBoundingClientRect();
    const width = 256;
    pop.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - width - 8))}px`;
    pop.style.top = `${Math.min(r.bottom + 6, window.innerHeight - 120)}px`;
  }

  function openPop(key: CharColumnKey) {
    openFilter = key;
    popQuery = '';
    paintHeader();
    paintPop();
    pop.classList.remove('hidden');
    // paintHeader replaced the buttons, so measure the fresh one.
    placePop(thead.querySelector<HTMLElement>(`[data-filter="${key}"]`)!);
    pop.querySelector<HTMLInputElement>('[data-pop="search"]')?.focus();
  }

  function closePop() {
    if (!openFilter) return;
    const key = openFilter;
    openFilter = null;
    pop.classList.add('hidden');
    paintHeader();
    thead.querySelector<HTMLButtonElement>(`[data-filter="${key}"]`)?.focus();
  }

  function setFilter(key: CharColumnKey, values: string[]) {
    const filters = { ...state.filters };
    if (values.length) filters[key] = values;
    else delete filters[key];
    state = { ...state, filters };
    paintHeader();
    paintRows();
  }

  // ---------- detail drawer ----------
  function openDrawer(index: number) {
    selected = index;
    const c = chars.find((x) => x.index === index);
    if (!c) return;
    drawer.classList.replace('hidden', 'flex');
    drawer.inert = false;
    document.documentElement.classList.add('drawer-open');
    backdrop.classList.remove('hidden');
    void drawer.offsetWidth; // apply display first so the slide-in transition runs
    drawer.classList.remove('translate-x-full');
    paintRows();
    tbody.querySelector(`tr[data-idx="${index}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  function closeDrawer() {
    if (selected === null) return;
    const was = selected;
    selected = null;
    drawer.classList.add('translate-x-full');
    drawer.inert = true;
    document.documentElement.classList.remove('drawer-open');
    backdrop.classList.add('hidden');
    setTimeout(() => {
      if (selected === null) drawer.classList.replace('flex', 'hidden');
    }, 200);
    paintRows();
    tbody.querySelector<HTMLElement>(`tr[data-idx="${was}"]`)?.focus();
  }

  function step(delta: number) {
    if (selected === null || rows.length === 0) return;
    const pos = rows.findIndex((r) => r.index === selected);
    const next = rows[Math.max(0, Math.min(rows.length - 1, (pos === -1 ? 0 : pos) + delta))];
    if (next) openDrawer(next.index);
  }

  async function copyText(btn: HTMLElement, text: string) {
    await navigator.clipboard.writeText(text);
    // Swap only the icon so a button's text label stays in place.
    const svg = btn.querySelector('svg');
    if (!svg) return;
    const tmp = document.createElement('span');
    tmp.innerHTML = icon('check', `${svg.getAttribute('class') ?? ''} text-emerald-400`);
    const check = tmp.firstElementChild!;
    svg.replaceWith(check);
    setTimeout(() => check.replaceWith(svg), 1000);
  }

  // ---------- events ----------
  search.addEventListener('input', () => {
    state = { ...state, query: search.value };
    paintRows();
  });

  thead.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const sortBtn = t.closest<HTMLElement>('[data-sort]');
    const filterBtn = t.closest<HTMLElement>('[data-filter]');
    if (sortBtn) {
      state = { ...state, sort: nextSort(state.sort, sortBtn.dataset.sort as CharColumnKey) };
      update();
    } else if (filterBtn) {
      e.stopPropagation();
      const key = filterBtn.dataset.filter as CharColumnKey;
      if (openFilter === key) closePop();
      else openPop(key);
    }
  });

  pop.addEventListener('click', (e) => e.stopPropagation());
  pop.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.dataset.pop === 'search') {
      popQuery = t.value;
      paintPop();
      const input = pop.querySelector<HTMLInputElement>('[data-pop="search"]')!;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });
  pop.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (!openFilter || t.dataset.value === undefined) return;
    const current = new Set(state.filters[openFilter] ?? []);
    if (t.checked) current.add(t.dataset.value);
    else current.delete(t.dataset.value);
    setFilter(openFilter, [...current]);
  });
  pop.addEventListener('click', (e) => {
    const action = (e.target as HTMLElement).closest<HTMLElement>('[data-pop]')?.dataset.pop;
    if (!openFilter || !action) return;
    if (action === 'close') return closePop();
    if (action === 'none') return (setFilter(openFilter, []), paintPop());
    if (action === 'all') {
      const q = popQuery.trim().toLowerCase();
      const shown = facetOptions(chars, openFilter)
        .map((o) => o.value)
        .filter((v) => !q || v.toLowerCase().includes(q));
      setFilter(openFilter, [...new Set([...(state.filters[openFilter] ?? []), ...shown])]);
      paintPop();
    }
  });

  document.addEventListener('click', closePop, { signal });
  wrap.addEventListener('scroll', closePop, { passive: true });
  window.addEventListener('resize', closePop, { signal });

  const pick = (e: Event) => {
    const tr = (e.target as HTMLElement).closest<HTMLElement>('[data-idx]');
    if (tr) openDrawer(Number(tr.dataset.idx));
  };
  tbody.addEventListener('click', pick);
  tbody.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(e);
    }
  });
  $('#glyph-strip').addEventListener('click', pick);

  drawer.addEventListener('click', (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-drawer],[data-copy]');
    if (!t) return;
    if (t.dataset.drawer === 'close') closeDrawer();
    if (t.dataset.drawer === 'prev') step(-1);
    if (t.dataset.drawer === 'next') step(1);
    if (t.dataset.copy !== undefined) void copyText(t, t.dataset.copy);
  });
  backdrop.addEventListener('click', closeDrawer);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (openFilter) closePop();
      else closeDrawer();
    } else if (selected !== null && !openFilter && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if ((e.target as HTMLElement).matches('input, textarea')) return;
      e.preventDefault();
      step(e.key === 'ArrowDown' ? 1 : -1);
    }
  };
  document.addEventListener('keydown', onKey, { signal });

  root.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t.closest('#clear-filters') || t.closest('[data-action="reset"]')) {
      state = { ...state, query: '', filters: {} };
      search.value = '';
      update();
    }
    const copy = t.closest<HTMLElement>('[data-copy]');
    if (copy && !drawer.contains(copy)) void copyText(copy, copy.dataset.copy!);
  });
  copyBtn.addEventListener('click', () => void copyText(copyBtn, formatCharListClipboard(rows)));

  update();
}

function stat(label: string, value: number, alert = '') {
  return `<div class="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
    <div class="font-mono text-lg font-semibold tabular-nums ${value > 0 ? alert : ''}">${value}</div>
    <div class="text-[10px] uppercase tracking-wide text-[var(--muted)]">${label}</div>
  </div>`;
}

function flagPill(flag: string) {
  const cls =
    flag === 'Homoglyph'
      ? 'bg-amber-500/15 text-amber-300'
      : flag === 'Invisible' || flag === 'Control'
        ? 'bg-red-500/15 text-red-300'
        : flag === 'Non-ASCII'
          ? 'bg-sky-500/15 text-sky-300'
          : 'bg-white/5 text-[var(--muted)]';
  return `<span class="rounded px-1.5 py-0.5 text-[10px] font-medium ${cls}">${flag}</span>`;
}

function reasons(threat: DomainThreat) {
  return `<ul class="flex flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-xs text-[var(--muted)]">
    ${threat.reasons.map((r) => `<li class="flex gap-2"><span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400"></span>${esc(r)}</li>`).join('')}
  </ul>`;
}

/** Unicode form with every non-ASCII character highlighted. */
function markUnicode(s: string) {
  return [...s]
    .map((ch) =>
      ch.codePointAt(0)! > 0x7f
        ? `<mark class="rounded bg-amber-400/20 px-0.5 text-amber-200 underline decoration-amber-400 decoration-2 underline-offset-4" title="U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}">${esc(ch)}</mark>`
        : esc(ch),
    )
    .join('');
}

/** ASCII form with every Punycode (xn--) label highlighted. */
function markAscii(s: string) {
  return s
    .split('.')
    .map((label) =>
      label.startsWith('xn--')
        ? `<mark class="rounded bg-sky-400/15 px-0.5 text-sky-200">${esc(label)}</mark>`
        : esc(label),
    )
    .join('<span class="text-[var(--muted)]">.</span>');
}

function idnCard(idn: IdnConversion, threat: DomainThreat | null) {
  const level = idn.hasIdn ? (threat?.level === 'danger' ? 'danger' : 'watch') : 'safe';
  const tone = TONES[level];
  const changed = idn.labels.filter((l) => l.changed);
  const copyBtn = (text: string, what: string) =>
    `<button type="button" data-copy="${esc(text)}" class="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 hover:text-white" aria-label="Copy ${what}">${icon('copy')}</button>`;

  return `<section aria-labelledby="idn-title" class="relative overflow-hidden rounded-2xl border-2 ${tone.ring} bg-gradient-to-br ${tone.glow} to-transparent p-4 sm:p-5">
    <div class="flex flex-wrap items-center gap-2">
      <span class="${level === 'safe' ? 'text-emerald-400' : level === 'danger' ? 'text-red-400' : 'text-amber-400'}">${icon(level === 'safe' ? 'shieldCheck' : 'shieldAlert', 'size-5')}</span>
      <h3 id="idn-title" class="text-sm font-bold tracking-wide">IDN · Punycode <span class="font-normal text-[var(--muted)]">(UTS #46)</span></h3>
      <span class="ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tone.pill}">${idn.hasIdn ? 'Internationalized domain' : 'Plain ASCII'}</span>
    </div>
    <p class="mt-2 text-xs text-[var(--muted)]">${
      idn.hasIdn
        ? 'Browsers may display the Unicode form, but DNS resolves the ASCII form. Highlighted characters are not plain ASCII: compare both before you trust this domain.'
        : 'No Unicode characters: what you see is exactly what DNS resolves.'
    }</p>
    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-3">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Displayed as (Unicode)</span>
          ${copyBtn(idn.unicode, 'Unicode form')}
        </div>
        <div class="font-glyph break-all text-2xl leading-snug sm:text-3xl">${markUnicode(idn.unicode || '-')}</div>
      </div>
      <div class="rounded-xl border border-[var(--border)] bg-[var(--bg)]/70 p-3">
        <div class="mb-1.5 flex items-center justify-between gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Resolves as (ASCII / ACE)</span>
          ${copyBtn(idn.ascii, 'ASCII form')}
        </div>
        <div class="font-mono break-all text-xl leading-snug sm:text-2xl">${markAscii(idn.ascii || '-')}</div>
      </div>
    </div>
    ${
      changed.length
        ? `<table class="mt-3 w-full text-left text-xs">
      <caption class="sr-only">Converted labels</caption>
      <thead class="text-[10px] uppercase tracking-wide text-[var(--muted)]"><tr><th class="py-1 pr-3 font-semibold">Label</th><th class="py-1 font-semibold">Punycode</th></tr></thead>
      <tbody>${changed.map((l) => `<tr class="border-t border-[var(--border)]"><td class="font-glyph py-1.5 pr-3 text-sm">${esc(l.input)}</td><td class="font-mono py-1.5">${esc(l.output)}</td></tr>`).join('')}</tbody>
    </table>`
        : ''
    }
    ${idn.errors.length ? `<p class="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">${esc(idn.errors[0]!)}</p>` : ''}
  </section>`;
}

function drawerHtml(c: CharDetail, rows: CharDetail[]) {
  const pos = rows.findIndex((r) => r.index === c.index);
  const fields: Array<[string, string]> = [
    ['Formal name', c.name],
    ['Code point', c.uPlus],
    ['Hex', `0x${c.hexPadded}`],
    ['Decimal', String(c.decimal)],
    ['Unicode block', c.block],
    ['Script group', c.script],
    ['General category', `${c.category}: ${c.categoryLabel}`],
    ['Combining class', String(c.combiningClass)],
    ['Bidi', c.bidiClass],
    ['HTML escape', c.htmlEscape],
    ['URL escape', c.urlEscape],
    ['JS escape', c.jsEscape],
    ['UTF-8', c.utf8Hex],
    ['UTF-16', c.utf16Hex],
  ];
  if (c.isHomoglyph && c.homoglyphLatin) fields.push(['Looks like (Latin)', c.homoglyphLatin]);
  if (c.isInvisible) fields.push(['Invisible / control', 'yes']);
  const navBtn = (dir: 'prev' | 'next', disabled: boolean) =>
    `<button type="button" data-drawer="${dir}" ${disabled ? 'disabled' : ''} class="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40" aria-label="${dir === 'prev' ? 'Previous' : 'Next'} character">${icon(dir === 'prev' ? 'up' : 'down', 'size-4')}</button>`;

  return `
    <div class="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
      <h3 id="drawer-title" class="text-sm font-semibold">Character ${pos === -1 ? '' : `${pos + 1} of ${rows.length}`}</h3>
      <div class="ml-auto flex items-center gap-1.5">
        ${navBtn('prev', pos <= 0)}
        ${navBtn('next', pos === -1 || pos >= rows.length - 1)}
        <button type="button" data-drawer="close" class="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] text-[var(--muted)] hover:bg-white/5 hover:text-white" aria-label="Close details">${icon('x', 'size-4')}</button>
      </div>
    </div>
    <div class="flex-1 overflow-auto p-4">
      <div class="mb-4 flex items-center gap-4">
        <div class="font-glyph flex size-20 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-5xl">${esc(c.display)}</div>
        <div class="min-w-0">
          <div class="font-mono text-lg font-semibold">${c.uPlus}</div>
          <div class="text-xs text-[var(--muted)]">${esc(c.name)}</div>
          <div class="mt-1.5 flex flex-wrap gap-1">${charFlags(c).map(flagPill).join('')}</div>
        </div>
      </div>
      <dl class="divide-y divide-[var(--border)] text-xs">
        ${fields
          .map(
            ([
              k,
              v,
            ]) => `<div class="group grid grid-cols-[124px_1fr_auto] items-center gap-2 py-1.5">
          <dt class="text-[var(--muted)]">${k}</dt>
          <dd class="font-mono break-all">${esc(v)}</dd>
          <button type="button" data-copy="${esc(v)}" class="inline-flex size-6 cursor-pointer items-center justify-center rounded-md text-[var(--muted)] opacity-0 hover:bg-white/5 hover:text-white focus:opacity-100 group-hover:opacity-100" aria-label="Copy ${k}">${icon('copy', 'size-3')}</button>
        </div>`,
          )
          .join('')}
      </dl>
      <a class="mt-4 inline-flex items-center gap-1 text-xs text-[var(--ember)] hover:underline" href="${c.unicodeOrgUrl}" target="_blank" rel="noreferrer">Unicode character page ${icon('external', 'size-3')}</a>
    </div>
    <p class="border-t border-[var(--border)] px-4 py-2 text-[11px] text-[var(--muted)]">Use the arrow keys to move between characters, Esc to close.</p>`;
}
