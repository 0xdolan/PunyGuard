// Capture real extension UI for store screenshots.
// Usage: node capture.mjs <extension dir> <out dir>
import { chromium } from '@playwright/test';

const [ext, out] = process.argv.slice(2);

const ctx = await chromium.launchPersistentContext('', {
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: [
    '--headless=new',
    `--disable-extensions-except=${ext}`,
    `--load-extension=${ext}`,
    '--host-resolver-rules=MAP news.example.com 127.0.0.1:8765',
  ],
  viewport: { width: 560, height: 640 },
  deviceScaleFactor: 2,
});
let [sw] = ctx.serviceWorkers();
if (!sw) sw = await ctx.waitForEvent('serviceworker', { timeout: 15000 });
const id = new URL(sw.url()).host;
const base = `chrome-extension://${id}`;

// A demo news page full of lookalike links; the real content script scans it.
const demo = await ctx.newPage();
await demo.goto('http://news.example.com/');
await demo.waitForTimeout(2500);
const demoTab = await sw.evaluate(async () => {
  const [t] = await chrome.tabs.query({ url: 'http://news.example.com/*' });
  return { id: t.id, url: t.url };
});

// Show the popup for the demo tab: answer the popup's "active tab" query with it.
const page = await ctx.newPage();
await page.addInitScript((tab) => {
  const query = chrome.tabs.query.bind(chrome.tabs);
  chrome.tabs.query = (q, ...rest) => (q && q.active ? Promise.resolve([tab]) : query(q, ...rest));
}, demoTab);
await page.goto(`${base}/popup.html`);
await page.waitForTimeout(1500);
const shell = page.locator('.popup-shell');
await shell.screenshot({ path: `${out}/popup-page.png` });

// Inspect the first (highest-risk) result.
await page.locator('ul li button').first().click();
await page.waitForTimeout(1500);
await shell.screenshot({ path: `${out}/popup-inspect.png` });

// Full analyzer tab.
const analyzer = await ctx.newPage();
await analyzer.setViewportSize({ width: 1180, height: 700 });
await analyzer.goto(`${base}/analyzer.html?domain=xn--mzn-5cdb9f.com`);
await analyzer.waitForTimeout(1500);
await analyzer.screenshot({ path: `${out}/analyzer.png` });

// Settings page.
const options = await ctx.newPage();
await options.setViewportSize({ width: 640, height: 700 });
await options.goto(`${base}/options.html`);
await options.waitForTimeout(800);
await options.screenshot({ path: `${out}/settings.png`, fullPage: true });

await ctx.close();
console.log('captured');
