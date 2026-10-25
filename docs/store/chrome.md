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
   | Privacy policy URL            | https://0xdolan.github.io/PunyGuard/privacy.html                                                                                |

4. **Distribution**: Public, all regions.
5. **Submit for review.** Access to all sites means an in-depth review; expect a few days.

## Reviewer notes (optional field)

> PunyGuard checks the hostnames on the current page for lookalike domains. To see it work, open any page that links to xn--mzn-5cdb9f.com (it displays as "amazon.com" with Cyrillic letters): the toolbar badge turns red and the popup lists it. All analysis is local; the extension makes no network requests.

## After approval

Set the listing URL in the `store` field for `chrome` (and `brave`) in [apps/site/src/downloads.ts](../../apps/site/src/downloads.ts) and add it to the README's Install section.

## Automatic updates for new versions

After the first version is approved, every release tag can upload and submit itself. The **Publish to the Chrome Web Store** job in the Release workflow does it with [chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli). One-time setup, about 10 minutes:

1. **Google Cloud project**: open https://console.cloud.google.com/apis/credentials and create a project (any name, for example `chrome-webstore-upload`).
2. **Enable the API**: open https://console.cloud.google.com/apis/library/chromewebstore.googleapis.com and click **Enable**.
3. **OAuth consent screen**: open https://console.cloud.google.com/auth/overview, click **Get started**, enter an app name and your email.
   - With a personal Gmail account choose **External** (Internal is only for Google Workspace).
   - Then go to **Audience** and click **Publish app** so it is "In production". In "Testing" status Google expires the refresh token after 7 days and uploads start failing.
4. **OAuth client**: **Clients** → **Create client** → type **Desktop app** → **Create**. Copy the **Client ID** and **Client secret**.
5. **Refresh token**: run `npx chrome-webstore-upload-keys`, paste the client ID and secret, and approve access in the browser window it opens (Google may warn that the app is unverified; it is your own app, so continue). Copy the refresh token it prints.
6. **Publisher ID and extension ID**: open the item in the developer dashboard. The address looks like `https://chrome.google.com/webstore/devconsole/<publisher-id>/<extension-id>/edit`.
7. **Repository secrets**:

   ```bash
   gh secret set CWS_CLIENT_ID
   gh secret set CWS_CLIENT_SECRET
   gh secret set CWS_REFRESH_TOKEN
   gh secret set CWS_PUBLISHER_ID
   gh secret set CWS_EXTENSION_ID
   ```

From then on, pushing a `vX.Y.Z` tag uploads `punyguard-x.y.z-chrome.zip` and submits it for review. Prerelease tags are not submitted. An upload fails while a previous version is still in review; wait for that review, then re-run the job. Without the secrets, the job is skipped with a notice.

## Updates

Upload the new `chrome.zip` from each release under **Package** → **Upload new package**, then submit.
