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

export async function getSettings(): Promise<PunyGuardSettings> {
  const data = await browser.storage.sync.get(KEY);
  return { ...DEFAULT_SETTINGS, ...(data[KEY] as Partial<PunyGuardSettings> | undefined) };
}

export async function saveSettings(patch: Partial<PunyGuardSettings>): Promise<PunyGuardSettings> {
  const current = await getSettings();
  const next = { ...current, ...patch };
  await browser.storage.sync.set({ [KEY]: next });
  return next;
}
