import type { PunyGuardSettings } from '@/lib/storage';

export function resolveTheme(
  theme: PunyGuardSettings['theme'],
): 'punyguardLight' | 'punyguardDark' {
  if (theme === 'light') return 'punyguardLight';
  if (theme === 'dark') return 'punyguardDark';
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'punyguardDark' : 'punyguardLight';
}

export function applyTheme(theme: PunyGuardSettings['theme']) {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.classList.toggle('dark', resolved === 'punyguardDark');
}
