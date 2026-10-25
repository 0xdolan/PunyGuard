# Store listing kit

Everything needed to publish PunyGuard, with text ready to paste into each store's form.

| Store                  | Guide                    | Package to upload (from the [latest release](https://github.com/0xdolan/PunyGuard/releases/latest)) |
| ---------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| Chrome Web Store       | [chrome.md](chrome.md)   | `punyguard-x.y.z-chrome.zip`                                                                        |
| Microsoft Edge Add-ons | [edge.md](edge.md)       | `punyguard-x.y.z-edge.zip`                                                                          |
| Firefox (AMO)          | [firefox.md](firefox.md) | `punyguard-x.y.z-firefox.zip` and `punyguard-x.y.z-sources.zip`                                     |
| Mac App Store (Safari) | [safari.md](safari.md)   | `punyguard-x.y.z-safari-xcode.zip` (archived in Xcode)                                              |

## Shared assets

| Asset                  | File                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Privacy policy URL     | https://0xdolan.github.io/PunyGuard/privacy.html                                                          |
| Homepage               | https://0xdolan.github.io/PunyGuard/                                                                      |
| Support URL            | https://github.com/0xdolan/PunyGuard/issues                                                               |
| Screenshots, 1280x800  | [assets/store/screenshots/chrome-1280x800-*.png](../../assets/store/screenshots/) (Chrome, Edge, Firefox) |
| Screenshots, 2880x1800 | [assets/store/screenshots/apple-2880x1800-*.png](../../assets/store/screenshots/) (Mac App Store)         |
| Promo tiles            | [assets/store/promo/](../../assets/store/promo/) (440x280 small, 1400x560 marquee)                        |
| Icons                  | [assets/store/icons/](../../assets/store/icons/) (128, 300, 1024; transparent)                            |

Screenshots, in order: page scan, inspector, analyzer, privacy and settings.

## Shared text

**Name:** PunyGuard

**Short description** (132 characters max; this is also the manifest description):

> Local-first protection against IDN homograph attacks, lookalike domains, and phishing script spoofing.

**Long description:**

> PunyGuard warns you about lookalike domains before you click them.
>
> Attackers register web addresses that look exactly like sites you trust by swapping Latin letters for identical-looking Cyrillic or Greek ones, or by hiding them in Punycode (xn--) form. "аmаzоn.com" can contain three Cyrillic letters and still look perfect. PunyGuard checks every link, script, frame, and form on the page you are viewing and flags these impostors.
>
> WHAT IT DOES
> • Scans every hostname on the page, including embedded links, scripts, and iframes
> • Detects homoglyphs, mixed scripts (for example Latin + Cyrillic), invisible characters, and Punycode
> • Shows a red, amber, or green badge with the number of risky domains
> • Explains each verdict: the Unicode form you see, the real ASCII form, and why it was flagged
> • Unicode inspector: every character's U+ code point, official name, block, script, and escapes
>
> PRIVATE BY DESIGN
> • All analysis runs on your device; PunyGuard makes no network requests
> • No accounts, analytics, tracking, or data collection
> • Open source (GPL-3.0): https://github.com/0xdolan/PunyGuard
>
> Learn how homograph attacks and invisible Unicode work in the free guide: https://github.com/0xdolan/PunyGuard/blob/main/docs/README.md

**Category:** Privacy & Security (or the store's closest equivalent).

## Permission justifications

The manifest requests `storage`, `tabs`, and host access to all sites. Nothing else.

| Permission              | Justification                                                                                                                                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Host access (all sites) | PunyGuard must read the hostnames of the links, scripts, frames, and forms on whatever page the user visits in order to check them for lookalike domains. Pages are analyzed locally and nothing is sent anywhere. |
| `tabs`                  | Associates each scan result and badge count with the correct tab and reads the tab's address to check the page's own domain.                                                                                       |
| `storage`               | Saves the user's settings and keeps the current tabs' scan results so the popup can show them.                                                                                                                     |

## Regenerating the screenshots

The images are real captures of the built extension, scanning a demo page full of lookalike links, composed onto branded frames. The tools live in [apps/extension/scripts/store/](../../apps/extension/scripts/store/). From the repository root:

```bash
pnpm build
python3 -m http.server 8765 --bind 127.0.0.1 --directory apps/extension/scripts/store/demo &
cd apps/extension
node scripts/store/capture.mjs "$PWD/.output/chrome-mv3" /tmp/store-raw
node scripts/store/compose.mjs /tmp/store-raw "$PWD/.output/chrome-mv3/assets" "$PWD/../../assets/brand/logo-mark.svg" /tmp/store-out
```

The composed images land in `/tmp/store-out`; copy them into `assets/store/`. Set `CHROMIUM_PATH` to a Chromium binary if Playwright's bundled browser is not installed.
