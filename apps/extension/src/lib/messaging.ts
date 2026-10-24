import type { ScanResult } from '@punyguard/core';
import type { PunyGuardSettings } from '@/lib/storage';

export type Message =
  | { type: 'GET_SCAN'; tabId?: number }
  | { type: 'SCAN_RESULT'; result: ScanResult | null }
  | { type: 'SETTINGS_UPDATED'; settings: PunyGuardSettings }
  | { type: 'PAGE_HOSTS'; hosts: string[]; pageHost: string }
  | { type: 'TOGGLE_ENABLED'; enabled: boolean };

export async function sendToBackground<T = unknown>(message: Message): Promise<T> {
  return browser.runtime.sendMessage(message) as Promise<T>;
}
