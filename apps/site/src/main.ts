import './style.css';
import { downloadsSection } from './downloads';
import { mountInspector } from './inspector';

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
            Catch lookalike domains and IDN phishing before you click, then inspect every character with formal U+ identity, offline-first.
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <a href="#/inspect" class="rounded-full bg-[var(--ember)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_28px_rgba(255,26,26,0.35)] hover:brightness-110 transition">Open Unicode inspector</a>
            <button type="button" data-scroll="get" class="cursor-pointer rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold hover:border-white/40 transition">Get the extension</button>
          </div>
        </div>
        <div class="flex justify-center">
          <img src="${base}logo.svg" alt="PunyGuard" class="h-48 w-48 rounded-3xl md:h-60 md:w-60" />
        </div>
      </section>

      <section class="mt-24 grid gap-4 md:grid-cols-3">
        ${card('Homograph radar', 'Confusable glyphs mapped to ASCII skeletons: Cyrillic, Greek, fullwidth, and more.')}
        ${card('Character forensics', 'U+, formal name, block, script, category, hex/dec, HTML/JS/URL escapes, invisible flags.')}
        ${card('Search everything', 'Filter by glyph, name, U+XXXX, hex, decimal, block, or script, then copy the list.')}
      </section>

      ${downloadsSection()}
    </main>

    <footer class="border-t border-white/10 py-8 text-center text-sm text-[var(--muted)]">
      Made with <svg class="inline h-3.5 w-3.5 align-[-0.125em] text-[#FF1A1A]" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="love"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg> by <a class="text-white hover:underline" href="https://github.com/0xdolan">0xdolan</a>
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
  <div class="drawer-shift min-h-screen">
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

function bind(page: 'home' | 'inspect') {
  if (page === 'home') {
    // Hash routing owns location.hash, so in-page jumps scroll instead of linking.
    app
      .querySelectorAll<HTMLElement>('[data-scroll]')
      .forEach((btn) =>
        btn.addEventListener('click', () =>
          document.getElementById(btn.dataset.scroll!)?.scrollIntoView({ behavior: 'smooth' }),
        ),
      );
    return;
  }
  const form = document.getElementById('inspect-form') as HTMLFormElement;
  const input = document.getElementById('domain-input') as HTMLInputElement;
  const out = document.getElementById('inspect-out')!;

  const run = () => {
    const value = input.value.trim();
    history.replaceState(null, '', `#/inspect?domain=${encodeURIComponent(value)}`);
    if (value) mountInspector(out, value);
    else out.innerHTML = '<p class="text-[var(--muted)]">Enter a domain to inspect.</p>';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run();
  });
  if (input.value.trim()) run();
}

window.addEventListener('hashchange', render);
render();
