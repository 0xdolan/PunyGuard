import { analyzeHostname, badgeState, scanHostnames, type ScanResult } from '@punyguard/core';
import { getSettings, saveSettings } from '@/lib/storage';
import type { Message } from '@/lib/messaging';

// MV3 backgrounds are unloaded when idle, so per-tab results live in session storage
// (cleared when the browser closes). The Map is a fallback where that area is missing.
const memoryResults = new Map<number, ScanResult>();
const resultKey = (tabId: number) => `punyguard.scan.${tabId}`;

async function getTabResult(tabId: number): Promise<ScanResult | null> {
  const session = browser.storage.session;
  if (!session) return memoryResults.get(tabId) ?? null;
  const data = await session.get(resultKey(tabId));
  return (data[resultKey(tabId)] as ScanResult | undefined) ?? null;
}

async function setTabResult(tabId: number, result: ScanResult) {
  const session = browser.storage.session;
  if (!session) memoryResults.set(tabId, result);
  else await session.set({ [resultKey(tabId)]: result });
}

async function deleteTabResult(tabId: number) {
  memoryResults.delete(tabId);
  await browser.storage.session?.remove(resultKey(tabId));
}

// Frames report concurrently; queue each tab's read-modify-write so none is lost.
const mergeQueues = new Map<number, Promise<unknown>>();

/** Content scripts run in every frame, so reports for a tab add to its result. */
function mergeTabResult(tabId: number, hosts: string[], pageHost: string): Promise<ScanResult> {
  const run = async () => {
    const prev = await getTabResult(tabId);
    const known = prev?.threats.map((t) => t.hostname) ?? [];
    const result = scanHostnames([...known, ...hosts], prev?.pageHost ?? pageHost);
    await setTabResult(tabId, result);
    return result;
  };
  const next = (mergeQueues.get(tabId) ?? Promise.resolve()).then(run, run);
  mergeQueues.set(tabId, next);
  return next;
}

function httpHostname(rawUrl: string | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    return ['http:', 'https:'].includes(url.protocol) ? url.hostname : null;
  } catch {
    return null;
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    const settings = await getSettings();
    await browser.action.setBadgeBackgroundColor({ color: '#16A34A' });
    if (!settings.enabled) {
      await browser.action.setBadgeText({ text: 'off' });
      await browser.action.setBadgeBackgroundColor({ color: '#6B7280' });
    }
  });

  browser.runtime.onMessage.addListener((message: Message, sender) => {
    return handleMessage(message, sender);
  });

  browser.tabs.onRemoved.addListener((tabId) => {
    void deleteTabResult(tabId);
  });

  browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    // A new document starts with a clean result; frames then report into it.
    if (info.status === 'loading' && info.url) {
      await deleteTabResult(tabId);
      return;
    }
    if (info.status !== 'complete' || !tab.url) return;
    const settings = await getSettings();
    const host = httpHostname(tab.url);
    if (!settings.enabled || !host) {
      await clearBadge(tabId);
      return;
    }
    // `complete` can arrive after the content script reported, so merge rather than replace.
    const result = await mergeTabResult(tabId, [host], host);
    await updateBadge(tabId, result, settings.badgeEnabled);
    void analyzeHostname(host);
  });
});

async function handleMessage(
  message: Message,
  sender: Browser.runtime.MessageSender,
): Promise<unknown> {
  switch (message.type) {
    case 'GET_SCAN': {
      const tabId = message.tabId ?? sender.tab?.id;
      if (tabId == null) return { type: 'SCAN_RESULT', result: null };
      const stored = await getTabResult(tabId);
      if (stored) return { type: 'SCAN_RESULT', result: stored };
      // Nothing stored (e.g. the page loaded before install): scan the tab's own URL.
      const tab = await browser.tabs.get(tabId).catch(() => null);
      const host = httpHostname(tab?.url);
      if (!host || !(await getSettings()).enabled) return { type: 'SCAN_RESULT', result: null };
      return { type: 'SCAN_RESULT', result: await mergeTabResult(tabId, [host], host) };
    }
    case 'PAGE_HOSTS': {
      const tabId = sender.tab?.id;
      if (tabId == null) return;
      const settings = await getSettings();
      if (!settings.enabled) return;
      const topHost = sender.frameId === 0 ? message.pageHost : httpHostname(sender.tab?.url);
      const result = await mergeTabResult(tabId, message.hosts, topHost ?? message.pageHost);
      await updateBadge(tabId, result, settings.badgeEnabled);
      return { type: 'SCAN_RESULT', result };
    }
    case 'TOGGLE_ENABLED': {
      const settings = await saveSettings({ enabled: message.enabled });
      if (!settings.enabled) {
        const tabs = await browser.tabs.query({});
        await Promise.all(tabs.map((t) => (t.id != null ? clearBadge(t.id) : Promise.resolve())));
        await browser.action.setBadgeText({ text: 'off' });
        await browser.action.setBadgeBackgroundColor({ color: '#6B7280' });
      } else {
        await browser.action.setBadgeText({ text: '' });
      }
      return settings;
    }
    case 'SETTINGS_UPDATED': {
      return message.settings;
    }
    default:
      return undefined;
  }
}

async function updateBadge(tabId: number, result: ScanResult, enabled: boolean) {
  if (!enabled) {
    await browser.action.setBadgeText({ tabId, text: '' });
    return;
  }
  const badge = badgeState(result);
  await browser.action.setBadgeText({ tabId, text: badge.text });
  await browser.action.setBadgeBackgroundColor({ tabId, color: badge.color });
}

async function clearBadge(tabId: number) {
  await deleteTabResult(tabId);
  await browser.action.setBadgeText({ tabId, text: '' });
}
