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
  icon: { path: string; hex: string; viewBox?: string };
}

/**
 * simple-icons dropped Microsoft's marks, so Edge uses `browser-edge` from
 * Bootstrap Icons 1.11.3 (MIT, (c) The Bootstrap Authors).
 */
const EDGE_ICON = {
  viewBox: '0 0 16 16',
  hex: '0078D7',
  path: 'M9.482 9.341c-.069.062-.17.153-.17.309 0 .162.107.325.3.456.877.613 2.521.54 2.592.538h.002c.667 0 1.32-.18 1.894-.519A3.84 3.84 0 0 0 16 6.819c.018-1.316-.44-2.218-.666-2.664l-.04-.08C13.963 1.487 11.106 0 8 0A8 8 0 0 0 .473 5.29C1.488 4.048 3.183 3.262 5 3.262c2.83 0 5.01 1.885 5.01 4.797h-.004v.002c0 .338-.168.832-.487 1.244l.006-.006zM.01 7.753a8.14 8.14 0 0 0 .753 3.641 8 8 0 0 0 6.495 4.564 5 5 0 0 1-.785-.377h-.01l-.12-.075a5.5 5.5 0 0 1-1.56-1.463A5.543 5.543 0 0 1 6.81 5.8l.01-.004.025-.012c.208-.098.62-.292 1.167-.285q.194.001.384.033a4 4 0 0 0-.993-.698l-.01-.005C6.348 4.282 5.199 4.263 5 4.263c-2.44 0-4.824 1.634-4.99 3.49m10.263 7.912q.133-.04.265-.084-.153.047-.307.086zM10.228 15.667a5 5 0 0 0 .303-.086l.082-.025a8.02 8.02 0 0 0 4.162-3.3.25.25 0 0 0-.331-.35q-.322.168-.663.294a6.4 6.4 0 0 1-2.243.4c-2.957 0-5.532-2.031-5.532-4.644q.003-.203.046-.399a4.54 4.54 0 0 0-.46 5.898l.003.005c.315.441.707.821 1.158 1.121h.003l.144.09c.877.55 1.721 1.078 3.328.996',
};

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
    icon: EDGE_ICON,
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

export function browserIcon(b: BrowserDownload, cls = 'size-7') {
  const viewBox = b.icon.viewBox ?? '0 0 24 24';
  return `<svg class="${cls}" viewBox="${viewBox}" fill="#${b.icon.hex}" aria-hidden="true"><path d="${b.icon.path}"/></svg>`;
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
