export interface PunyGuardSettings {
  enabled: boolean;
  theme: 'system' | 'light' | 'dark';
  showSafeDomains: boolean;
  scanIframes: boolean;
  badgeEnabled: boolean;
}

export const DEFAULT_SETTINGS: PunyGuardSettings = {
  enabled: true,
  theme: 'system',
  showSafeDomains: false,
  scanIframes: true,
  badgeEnabled: true,
};

const KEY = 'punyguard.settings';

// Safari and some Chromium forks may not expose sync storage; fall back to local.
const area = () => browser.storage.sync ?? browser.storage.local;

export async function getSettings(): Promise<PunyGuardSettings> {
  const data = await area().get(KEY);
  return { ...DEFAULT_SETTINGS, ...(data[KEY] as Partial<PunyGuardSettings> | undefined) };
}

export async function saveSettings(patch: Partial<PunyGuardSettings>): Promise<PunyGuardSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await area().set({ [KEY]: next });
  return next;
}
