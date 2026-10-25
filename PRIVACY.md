# Privacy Policy

**PunyGuard** browser extension and website (https://0xdolan.github.io/PunyGuard/)

Effective date: October 24, 2026

## Summary

PunyGuard does not collect, transmit, sell, or share any personal data or browsing data. All analysis happens on your device. The extension makes no network requests.

## What the extension reads

To warn you about lookalike domains, the extension reads, on the pages you visit:

- the page's own hostname,
- the hostnames in links, scripts, frames, forms, and images on the page, and
- the first part of the page's HTML, to find domain names mentioned in text.

These hostnames are analyzed in memory by code inside the extension. Page content, URLs, and results are never sent anywhere.

## What the extension stores

| Data                                                                     | Where                                                                                          | How long                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Your settings (on/off, theme, badge, iframe scanning, show safe domains) | The browser's extension storage (`storage.sync`, or `storage.local` where sync is unavailable) | Until you change them or uninstall                             |
| Scan results for open tabs                                               | The browser's session storage (`storage.session`)                                              | Cleared when you navigate, close the tab, or close the browser |

If you have turned on your browser's own sync feature (for example Chrome Sync or Firefox Sync), your browser may sync the settings above between your devices. That sync is provided and governed by your browser vendor, not by PunyGuard. Scan results are never synced.

## Permissions and why they are needed

| Permission                         | Purpose                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| Access to all sites (`<all_urls>`) | Read the hostnames on pages you visit so they can be checked   |
| `tabs`                             | Match scan results to the right tab and read the tab's address |
| `storage`                          | Save your settings and the current tabs' scan results          |

## What PunyGuard does not do

- No analytics, telemetry, tracking, or advertising.
- No accounts, cookies, or user identifiers.
- No remote code: all code ships inside the extension package.
- No sale or transfer of data to anyone, for any purpose.

## Links you choose to open

The popup and settings page contain links to the project's documentation, source code, and website on GitHub. Opening them is ordinary web browsing, subject to [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## The website

The PunyGuard website is a static page hosted on GitHub Pages. Its Unicode inspector runs entirely in your browser; what you type is not sent anywhere. The site uses no analytics or cookies. GitHub, as the host, may process standard request data such as IP addresses under its own privacy statement.

## Children

PunyGuard does not knowingly collect data from anyone, including children under 13.

## Changes

Changes to this policy are published in this file and at https://0xdolan.github.io/PunyGuard/privacy.html (kept in sync, from `apps/site/public/privacy.html`), with a new effective date, and listed in the [changelog](CHANGELOG.md).

## Contact

Questions about this policy: open an issue at https://github.com/0xdolan/PunyGuard/issues. Security reports: see [SECURITY.md](SECURITY.md).
