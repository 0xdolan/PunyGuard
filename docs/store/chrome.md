# Chrome Web Store

Covers Chrome, Brave, Opera, and Vivaldi (they install from the Chrome Web Store). Shared text and assets are in [README.md](README.md).

## One-time setup

1. Open https://chrome.google.com/webstore/devconsole and register as a developer (one-time $5 fee).
2. Turn on 2-step verification on the Google account and verify the contact email in **Account**.

## Submit

1. **New item** → upload `punyguard-x.y.z-chrome.zip`.
2. **Store listing** tab:

   | Field                   | Value                                                        |
   | ----------------------- | ------------------------------------------------------------ |
   | Description             | The long description from [README.md](README.md#shared-text) |
   | Category                | Privacy & Security                                           |
   | Language                | English                                                      |
   | Store icon              | `assets/store/icons/icon-128.png`                            |
   | Screenshots             | The four `assets/store/screenshots/chrome-1280x800-*.png`    |
   | Small promo tile        | `assets/store/promo/chrome-promo-small-440x280.png`          |
   | Marquee promo tile      | `assets/store/promo/chrome-promo-marquee-1400x560.png`       |
   | Official URL / Homepage | https://0xdolan.github.io/PunyGuard/                         |
   | Support URL             | https://github.com/0xdolan/PunyGuard/issues                  |

3. **Privacy** tab:

   | Field                         | Value                                                                                                                           |
   | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
   | Single purpose                | Warns users about lookalike (IDN homograph) domains on the web pages they visit, and lets them inspect any domain's characters. |
   | `storage` justification       | From the [permission table](README.md#permission-justifications)                                                                |
   | `tabs` justification          | From the permission table                                                                                                       |
   | Host permission justification | From the permission table                                                                                                       |
   | Are you using remote code?    | **No.** All code is bundled in the package.                                                                                     |
   | Data usage                    | Tick nothing: PunyGuard collects none of the listed data types.                                                                 |
   | Certifications                | Tick all three (no selling, no unrelated use, no creditworthiness use).                                                         |
   | Privacy policy URL            | https://github.com/0xdolan/PunyGuard/blob/main/PRIVACY.md                                                                       |

4. **Distribution**: Public, all regions.
5. **Submit for review.** Access to all sites means an in-depth review; expect a few days.

## Reviewer notes (optional field)

> PunyGuard checks the hostnames on the current page for lookalike domains. To see it work, open any page that links to xn--mzn-5cdb9f.com (it displays as "amazon.com" with Cyrillic letters): the toolbar badge turns red and the popup lists it. All analysis is local; the extension makes no network requests.

## After approval

Set the listing URL in the `store` field for `chrome` (and `brave`) in [apps/site/src/downloads.ts](../../apps/site/src/downloads.ts) and add it to the README's Install section.

## Updates

Upload the new `chrome.zip` from each release under **Package** → **Upload new package**, then submit.
