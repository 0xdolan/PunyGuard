import { analyzeHostname, badgeState, scanHostnames, type ScanResult } from '@punyguard/core';
import { getSettings, saveSettings } from '@/lib/storage';
import type { Message } from '@/lib/messaging';

const tabResults = new Map<number, ScanResult>();

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
    tabResults.delete(tabId);
  });

  browser.tabs.onUpdated.addListener(async (tabId, info, tab) => {
    if (info.status !== 'complete' || !tab.url) return;
    const settings = await getSettings();
    if (!settings.enabled) {
      await clearBadge(tabId);
      return;
    }
    try {
      const url = new URL(tab.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        await clearBadge(tabId);
        return;
      }
      const seed = scanHostnames([url.hostname], url.hostname);
      tabResults.set(tabId, seed);
      await updateBadge(tabId, seed, settings.badgeEnabled);
      void analyzeHostname(url.hostname);
    } catch {
      await clearBadge(tabId);
    }
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
      return { type: 'SCAN_RESULT', result: tabResults.get(tabId) ?? null };
    }
    case 'PAGE_HOSTS': {
      const tabId = sender.tab?.id;
      if (tabId == null) return;
      const settings = await getSettings();
      if (!settings.enabled) return;
      const result = scanHostnames(message.hosts, message.pageHost);
      tabResults.set(tabId, result);
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
  tabResults.delete(tabId);
  await browser.action.setBadgeText({ tabId, text: '' });
}
