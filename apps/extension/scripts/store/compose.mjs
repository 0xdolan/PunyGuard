// Compose store images from raw captures.
// Usage: node compose.mjs <raw dir> <built extension assets dir> <logo svg> <out dir>
import { chromium } from '@playwright/test';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';

const [raw, assets, logo, out] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const manrope = (weight) =>
  `${assets}/${readdirSync(assets).find((f) => f.startsWith(`manrope-latin-${weight}-normal`) && f.endsWith('.woff2'))}`;

const css = `
@font-face { font-family: Manrope; font-weight: 500; src: url(file://${manrope(500)}); }
@font-face { font-family: Manrope; font-weight: 700; src: url(file://${manrope(700)}); }
@font-face { font-family: Manrope; font-weight: 800; src: url(file://${manrope(800)}); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1280px; height: 800px; overflow: hidden; }
body {
  font-family: Manrope, sans-serif; color: #f5f5f7; font-variant-ligatures: none;
  background: radial-gradient(ellipse 80% 70% at 15% -10%, rgba(255,26,26,.30), transparent 60%),
              radial-gradient(ellipse 60% 60% at 110% 110%, rgba(255,26,26,.18), transparent 60%), #0b0d10;
}
.brand { display: flex; align-items: center; gap: 12px; font-weight: 800; font-size: 22px; letter-spacing: -.01em; }
.brand img { width: 36px; height: 36px; }
h1 { font-weight: 800; font-size: 50px; line-height: 1.08; letter-spacing: -.02em; margin-top: 28px; }
h1 em { font-style: normal; color: #ff3b3b; }
p.sub { margin-top: 20px; font-size: 21px; line-height: 1.5; color: #b6bac3; font-weight: 500; }
.shot { border-radius: 18px; box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.10); }
.split { display: grid; grid-template-columns: 1fr 560px; gap: 56px; align-items: center; height: 100%; padding: 0 72px; }
.split .shot { width: 560px; }
.wide { display: flex; flex-direction: column; height: 100%; padding: 52px 72px 0; }
.wide h1 { font-size: 40px; margin-top: 18px; }
.wide .shot { margin-top: 30px; width: 1136px; border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
`;

const split = (img, title, sub) => `
<div class="split"><div>
  <div class="brand"><img src="file://${logo}">PunyGuard</div>
  <h1>${title}</h1><p class="sub">${sub}</p>
</div><img class="shot" src="file://${raw}/${img}"></div>`;

const shots = [
  [
    '01-page-scan',
    split(
      'popup-page.png',
      'Catch <em>lookalike domains</em> before you click',
      'Every link on the page is checked on your device. Cyrillic, Greek, and Punycode impostors are flagged in red.',
    ),
  ],
  [
    '02-inspect',
    split(
      'popup-inspect.png',
      'See what a domain <em>really</em> is',
      'xn--mzn-5cdb9f.com displays as "amazon.com", but three of its letters are Cyrillic. PunyGuard shows both forms.',
    ),
  ],
  [
    '03-analyzer',
    `<div class="wide">
    <div class="brand"><img src="file://${logo}">PunyGuard</div>
    <h1>Every character, with its <em>Unicode identity</em></h1>
    <img class="shot" src="file://${raw}/analyzer.png"></div>`,
  ],
  [
    '04-private',
    split(
      'settings.png',
      '<em>Private</em> by design',
      'No data leaves your browser: no accounts, no analytics, no network requests. Only two permissions plus access to the pages you visit.',
    ),
  ],
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

async function render(name, body, width, height, scale, extraCss = '') {
  const file = `${out}/.${name}.html`;
  writeFileSync(
    file,
    `<!doctype html><meta charset="utf-8"><style>${css}
    html, body { width: ${width}px; height: ${height}px; } ${extraCss}</style>${body}`,
  );
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.goto(`file://${file}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/${name}.png` });
  await page.close();
}

for (const [name, body] of shots) {
  await render(`chrome-1280x800-${name}`, body, 1280, 800, 1);
  await render(`apple-2880x1800-${name}`, body, 1280, 800, 2.25);
}

// Chrome Web Store promo tiles.
const tile = (
  h1size,
  subsize,
) => `<div style="height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 9%">
  <div class="brand"><img src="file://${logo}">PunyGuard</div>
  <h1 style="font-size:${h1size}px;margin-top:14px">Spot <em>lookalike</em> domains</h1>
  ${subsize ? `<p class="sub" style="font-size:${subsize}px;margin-top:12px">Local IDN homograph and phishing protection</p>` : ''}</div>`;
await render('chrome-promo-small-440x280', tile(34, 0), 440, 280, 1);
await render('chrome-promo-marquee-1400x560', tile(64, 24), 1400, 560, 1);

await browser.close();
console.log('composed');
