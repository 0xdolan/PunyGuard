import { siBrave, siFirefoxbrowser, siGooglechrome, siSafari } from 'simple-icons';

/**
 * Where each browser's "Get" button points. Set `store` to the listing URL once
 * the extension is published there; until then the button opens the latest
 * GitHub release, which carries a package for every browser.
 */
export const RELEASES_URL = 'https://github.com/0xdolan/PunyGuard/releases/latest';

export interface BrowserDownload {
  id: string;
  name: string;
  /** Store listing URL, or null to fall back to the GitHub release. */
  store: string | null;
  /** Release file a user downloads for this browser. */
  file: string;
  /** Short install hint shown under the name. */
  hint: string;
  icon: { path: string; hex: string } | null;
}

export const BROWSERS: BrowserDownload[] = [
  {
    id: 'chrome',
    name: 'Chrome',
    store: null,
    file: 'chrome.zip',
    hint: 'Load unpacked',
    icon: siGooglechrome,
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    store: null,
    file: 'edge.zip',
    hint: 'Load unpacked',
    icon: null, // Microsoft does not license its logo to icon sets; a neutral icon is used.
  },
  {
    id: 'brave',
    name: 'Brave',
    store: null,
    file: 'chrome.zip',
    hint: 'Uses the Chrome build',
    icon: siBrave,
  },
  {
    id: 'firefox',
    name: 'Firefox',
    store: null,
    file: 'firefox.xpi',
    hint: 'Firefox 140 or newer',
    icon: siFirefoxbrowser,
  },
  {
    id: 'safari',
    name: 'Safari',
    store: null,
    file: 'safari-xcode.zip',
    hint: 'macOS, build in Xcode',
    icon: siSafari,
  },
];

const GLOBE =
  '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>';

export function browserIcon(b: BrowserDownload, cls = 'size-7') {
  if (!b.icon) {
    return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLOBE}</svg>`;
  }
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="#${b.icon.hex}" aria-hidden="true"><path d="${b.icon.path}"/></svg>`;
}

export function downloadsSection() {
  return `<section id="get" class="mt-24 scroll-mt-8" aria-labelledby="get-title">
    <h2 id="get-title" class="text-2xl font-extrabold tracking-tight md:text-3xl">Get the extension</h2>
    <p class="mt-2 max-w-2xl text-sm text-[var(--muted)]">Store listings are coming. Until then, each button opens the latest release, which has a package for your browser.</p>
    <ul class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      ${BROWSERS.map(
        (b) => `<li>
        <a href="${b.store ?? RELEASES_URL}" target="_blank" rel="noreferrer" data-browser="${b.id}"
          class="group flex h-full flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ember)]">
          <span class="flex size-12 items-center justify-center rounded-xl bg-white/[0.04]">${browserIcon(b)}</span>
          <span class="text-sm font-bold">${b.name}</span>
          <span class="text-[11px] text-[var(--muted)]">${b.store ? 'Get it from the store' : b.hint}</span>
          <span class="mt-auto font-mono text-[10px] text-[var(--muted)] group-hover:text-white">${b.store ? 'store' : b.file}</span>
        </a>
      </li>`,
      ).join('')}
    </ul>
    <p class="mt-3 text-xs text-[var(--muted)]">Opera and Vivaldi use the Chrome package. See the <a class="text-white hover:underline" href="https://github.com/0xdolan/PunyGuard#install" target="_blank" rel="noreferrer">install guide</a> for step-by-step instructions.</p>
  </section>`;
}
