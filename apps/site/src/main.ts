import './style.css';
import {
  analyzeDomainCharacters,
  analyzeHostname,
  convertIdn,
  filterCharacters,
  formatCharListClipboard,
  type CharDetail,
} from '@punyguard/core';

declare const __APP_VERSION__: string;

const app = document.querySelector<HTMLDivElement>('#app')!;
const base = import.meta.env.BASE_URL;

function route(): { page: 'home' | 'inspect'; domain: string } {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, qs] = hash.split('?');
  const params = new URLSearchParams(qs ?? '');
  if (path?.startsWith('inspect')) {
    return { page: 'inspect', domain: params.get('domain') ?? '' };
  }
  return { page: 'home', domain: '' };
}

function render() {
  const { page, domain } = route();
  app.innerHTML = page === 'inspect' ? inspectPage(domain) : homePage();
  bind(page);
}

function homePage() {
  return `
  <div class="min-h-screen bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(255,26,26,0.25),transparent)]">
    <header class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <a href="#/" class="flex items-center gap-2.5 font-extrabold tracking-tight">
        <img src="${base}logo-mark.svg" alt="" class="h-8 w-8" />
        <span>PunyGuard</span>
      </a>
      <nav class="flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
        <a class="hover:text-white transition" href="#/inspect">Inspector</a>
        <a class="hover:text-white transition" href="https://github.com/0xdolan/PunyGuard" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </header>

    <main class="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 md:pt-16">
      <section class="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div class="reveal">
          <h1 class="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">PunyGuard</h1>
          <p class="mt-4 max-w-xl text-lg text-[var(--muted)]">
            Catch lookalike domains and IDN phishing before you click — then inspect every character with formal U+ identity, offline-first.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="#/inspect" class="rounded-full bg-[var(--ember)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,26,26,0.35)] hover:brightness-110 transition">Open Unicode inspector</a>
            <a href="https://github.com/0xdolan/PunyGuard/releases" class="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold hover:border-white/40 transition">Get extension</a>
          </div>
        </div>
        <div class="flex justify-center">
          <img src="${base}logo.svg" alt="PunyGuard" class="h-48 w-48 rounded-3xl md:h-60 md:w-60" />
        </div>
      </section>

      <section class="mt-24 grid gap-4 md:grid-cols-3">
        ${card('Homograph radar', 'Confusable glyphs mapped to ASCII skeletons — Cyrillic, Greek, fullwidth, and more.')}
        ${card('Character forensics', 'U+, formal name, block, script, category, hex/dec, HTML/JS/URL escapes, invisible flags.')}
        ${card('Search everything', 'Filter by glyph, name, U+XXXX, hex, decimal, block, or script — then copy the list.')}
      </section>
    </main>

    <footer class="border-t border-white/10 py-8 text-center text-sm text-[var(--muted)]">
      Made ♥ by <a class="text-white hover:underline" href="https://github.com/0xdolan">0xdolan</a>
      · <a class="text-white hover:underline" href="https://github.com/0xdolan/PunyGuard">Source</a>
      · v${__APP_VERSION__}
    </footer>
  </div>`;
}

function card(title: string, body: string) {
  return `<article class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <h3 class="font-bold">${title}</h3>
    <p class="mt-2 text-sm leading-relaxed text-[var(--muted)]">${body}</p>
  </article>`;
}

function inspectPage(domain: string) {
  return `
  <div class="min-h-screen">
    <header class="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <a href="#/" class="flex items-center gap-2 font-bold">
          <img src="${base}logo-mark.svg" alt="" class="h-7 w-7" />
          PunyGuard
        </a>
        <span class="text-sm text-[var(--muted)]">Unicode inspector</span>
        <div class="ml-auto text-xs text-[var(--muted)]">Local analysis · U+ notation</div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <form id="inspect-form" class="flex flex-col gap-3 sm:flex-row">
        <input id="domain-input" class="font-mono h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--ember)]" placeholder="Paste or type a domain…" value="${escapeAttr(domain)}" spellcheck="false" />
        <button class="h-11 cursor-pointer rounded-xl bg-[var(--ember)] px-5 text-sm font-semibold hover:brightness-110 transition" type="submit">Check</button>
      </form>
      <div id="inspect-out" class="mt-6"></div>
    </main>
  </div>`;
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bind(page: 'home' | 'inspect') {
  if (page !== 'inspect') return;
  const form = document.getElementById('inspect-form') as HTMLFormElement;
  const input = document.getElementById('domain-input') as HTMLInputElement;
  const out = document.getElementById('inspect-out')!;

  const run = () => {
    const value = input.value.trim();
    history.replaceState(null, '', `#/inspect?domain=${encodeURIComponent(value)}`);
    out.innerHTML = value
      ? renderReport(value)
      : '<p class="text-[var(--muted)]">Enter a domain to inspect.</p>';
    bindReport(out, value);
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
  if (input.value.trim()) run();
}

function renderReport(raw: string) {
  const report = analyzeDomainCharacters(raw);
  const threat = report.normalizedHost ? analyzeHostname(report.normalizedHost) : null;
  const idn = report.normalizedHost ? convertIdn(report.normalizedHost) : null;
  return `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <h2 class="font-mono text-lg font-semibold">${escapeHtml(report.normalizedHost ?? raw)}</h2>
        ${threat ? `<span class="rounded-md px-2 py-0.5 text-xs font-semibold ${threat.level === 'danger' ? 'bg-red-500/15 text-red-400' : threat.level === 'watch' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}">${threat.level} · ${threat.score}</span>` : ''}
      </div>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        ${stat('Chars', report.characters.length)}
        ${stat('Non-ASCII', report.nonAsciiCount)}
        ${stat('Homoglyphs', report.homoglyphCount)}
        ${stat('Invisible', report.invisibleCount)}
      </div>
      ${
        idn
          ? `<div class="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 text-sm">
        <div class="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">IDN · Punycode (UTS #46)</div>
        <div class="font-mono text-xs grid gap-1">
          <div><span class="text-[var(--muted)]">Unicode</span> · ${escapeHtml(idn.unicode)}</div>
          <div><span class="text-[var(--muted)]">ACE</span> · ${escapeHtml(idn.ascii)}</div>
        </div>
      </div>`
          : ''
      }
      <div class="flex flex-wrap gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3" id="glyph-strip">
        ${report.characters
          .map(
            (c) =>
              `<button type="button" data-idx="${c.index}" class="font-glyph size-9 cursor-pointer rounded-md border border-[var(--border)] bg-[var(--bg)] text-base hover:border-[var(--ember)] ${c.isInvisible ? 'ring-1 ring-red-500/70' : ''} ${c.isHomoglyph ? 'ring-1 ring-amber-500/60' : ''}" title="${escapeAttr(c.uPlus + ' ' + c.name)}">${escapeHtml(c.display)}</button>`,
          )
          .join('')}
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <input id="char-filter" class="font-mono h-10 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm" placeholder="Search name, U+, hex, dec, block, script…" />
        <button id="copy-list" type="button" class="h-10 cursor-pointer rounded-xl border border-[var(--border)] px-4 text-sm hover:bg-white/5">Copy list</button>
      </div>
      <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div class="overflow-auto rounded-xl border border-[var(--border)] max-h-[420px]">
          <table class="w-full min-w-[640px] text-left text-xs" id="char-table">
            <thead class="sticky top-0 bg-[var(--card)] text-[10px] uppercase tracking-wide text-[var(--muted)]">
              <tr>
                <th class="px-3 py-2">#</th><th class="px-3 py-2">Char</th><th class="px-3 py-2">U+</th>
                <th class="px-3 py-2">Name</th><th class="px-3 py-2">Block</th><th class="px-3 py-2">Cat</th><th class="px-3 py-2">Dec</th>
              </tr>
            </thead>
            <tbody id="char-tbody">${rowsHtml(report.characters)}</tbody>
          </table>
        </div>
        <aside id="detail-panel" class="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
          Select a character for full properties.
        </aside>
      </div>
    </div>`;
}

function stat(label: string, value: number) {
  return `<div class="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2">
    <div class="font-mono text-lg font-semibold tabular-nums">${value}</div>
    <div class="text-[10px] uppercase tracking-wide text-[var(--muted)]">${label}</div>
  </div>`;
}

function rowsHtml(chars: CharDetail[]) {
  return chars
    .map(
      (
        c,
      ) => `<tr data-idx="${c.index}" class="cursor-pointer border-t border-[var(--border)]/70 hover:bg-white/5">
      <td class="font-mono px-3 py-2 text-[var(--muted)]">${c.index}</td>
      <td class="font-glyph px-3 py-2 text-base">${escapeHtml(c.display)}</td>
      <td class="font-mono px-3 py-2">${c.uPlus}</td>
      <td class="font-mono px-3 py-2 max-w-[200px] truncate" title="${escapeAttr(c.name)}">${escapeHtml(c.name)}</td>
      <td class="px-3 py-2 text-[var(--muted)]">${escapeHtml(c.block)}</td>
      <td class="font-mono px-3 py-2">${c.category}</td>
      <td class="font-mono px-3 py-2">${c.decimal}</td>
    </tr>`,
    )
    .join('');
}

function detailHtml(c: CharDetail) {
  const rows: Array<[string, string]> = [
    ['Formal name', c.name],
    ['Code point', c.uPlus],
    ['Hex', `0x${c.hexPadded}`],
    ['Decimal', String(c.decimal)],
    ['Unicode block', c.block],
    ['Script group', c.script],
    ['General category', `${c.category} — ${c.categoryLabel}`],
    ['Combining class', String(c.combiningClass)],
    ['Bidi', c.bidiClass],
    ['HTML escape', c.htmlEscape],
    ['URL escape', c.urlEscape],
    ['JS escape', c.jsEscape],
    ['UTF-8', c.utf8Hex],
    ['UTF-16', c.utf16Hex],
  ];
  if (c.isHomoglyph && c.homoglyphLatin) rows.push(['Homoglyph → Latin', c.homoglyphLatin]);
  if (c.isInvisible) rows.push(['Invisible / control', 'yes']);

  return `
    <div class="mb-3 flex items-center gap-3">
      <div class="font-glyph flex size-14 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg)] text-3xl">${escapeHtml(c.display)}</div>
      <div>
        <div class="font-mono font-semibold text-white">${c.uPlus}</div>
        <div class="text-xs">${escapeHtml(c.name)}</div>
      </div>
    </div>
    <dl class="flex flex-col gap-2 text-xs">
      ${rows.map(([k, v]) => `<div class="grid grid-cols-[120px_1fr] gap-2"><dt class="text-[var(--muted)]">${k}</dt><dd class="font-mono break-all text-white">${escapeHtml(v)}</dd></div>`).join('')}
    </dl>
    <a class="mt-4 inline-block text-xs text-[var(--ember)] hover:underline" href="${c.unicodeOrgUrl}" target="_blank" rel="noreferrer">Unicode character page →</a>
  `;
}

function bindReport(root: HTMLElement, raw: string) {
  const report = analyzeDomainCharacters(raw);
  let selected: CharDetail | null = report.characters[0] ?? null;
  const panel = root.querySelector('#detail-panel')!;
  const tbody = root.querySelector('#char-tbody')!;
  const filter = root.querySelector('#char-filter') as HTMLInputElement;
  const copyBtn = root.querySelector('#copy-list')!;

  const paint = (chars: CharDetail[]) => {
    tbody.innerHTML = rowsHtml(chars);
    tbody.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', () => {
        const idx = Number((tr as HTMLElement).dataset.idx);
        selected = report.characters.find((c) => c.index === idx) ?? null;
        if (selected) panel.innerHTML = detailHtml(selected);
      });
    });
  };

  if (selected) panel.innerHTML = detailHtml(selected);
  paint(report.characters);

  root.querySelectorAll('#glyph-strip button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number((btn as HTMLElement).dataset.idx);
      selected = report.characters.find((c) => c.index === idx) ?? null;
      if (selected) panel.innerHTML = detailHtml(selected);
    });
  });

  filter.addEventListener('input', () => {
    paint(filterCharacters(report.characters, filter.value));
  });

  copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(formatCharListClipboard(report.characters));
    copyBtn.textContent = 'Copied';
    setTimeout(() => {
      copyBtn.textContent = 'Copy list';
    }, 1200);
  });
}

window.addEventListener('hashchange', render);
render();
