import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SITE_URL = 'https://0xdolan.github.io/PunyGuard/';
export const ANALYZER_SITE = 'https://0xdolan.github.io/PunyGuard/#/inspect';
export const REPO_URL = 'https://github.com/0xdolan/PunyGuard';
export const DOCS_URL = `${REPO_URL}/blob/main/docs/README.md`;

export function openAnalyzer(domain?: string) {
  const q = domain ? `?domain=${encodeURIComponent(domain)}` : '';
  void browser.tabs.create({ url: browser.runtime.getURL(`/analyzer.html${q}`) });
}

export function openSiteInspector(domain?: string) {
  const hash = domain ? `#/inspect?domain=${encodeURIComponent(domain)}` : '#/inspect';
  void browser.tabs.create({ url: `${SITE_URL}${hash}` });
}
