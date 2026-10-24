import { extractHostnamesFromHtml } from '@punyguard/core';
import { getSettings } from '@/lib/storage';

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  allFrames: true,

  async main() {
    const settings = await getSettings();
    if (!settings.enabled) return;
    if (!settings.scanIframes && window !== window.top) return;

    const collect = () => {
      const hosts = new Set<string>();
      try {
        hosts.add(location.hostname);
      } catch {
        /* opaque origin */
      }

      const selectors =
        'a[href], script[src], iframe[src], embed[src], object[data], link[href], form[action], img[src]';
      document.querySelectorAll(selectors).forEach((el) => {
        const attr =
          el.getAttribute('href') ||
          el.getAttribute('src') ||
          el.getAttribute('data') ||
          el.getAttribute('action');
        if (!attr) return;
        try {
          const url = new URL(attr, location.href);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            hosts.add(url.hostname);
          }
        } catch {
          /* ignore */
        }
      });

      const sample = document.documentElement?.innerHTML?.slice(0, 250_000) ?? '';
      extractHostnamesFromHtml(sample).forEach((h) => hosts.add(h));

      void browser.runtime.sendMessage({
        type: 'PAGE_HOSTS',
        hosts: [...hosts],
        pageHost: location.hostname,
      });
    };

    collect();

    let timer: ReturnType<typeof setTimeout> | null = null;
    const obs = new MutationObserver(() => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        collect();
      }, 1200);
    });
    obs.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'action', 'data'],
    });
  },
});
