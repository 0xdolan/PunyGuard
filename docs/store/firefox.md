# Firefox: addons.mozilla.org (AMO)

Shared text and assets are in [README.md](README.md).

## One-time setup

Sign in at https://addons.mozilla.org/developers/ with a Mozilla account (free).

## Submit

1. **Submit a New Add-on** → **On this site** (listed on AMO).
2. Upload `punyguard-x.y.z-firefox.zip` and choose Firefox (desktop). The validator should report no errors; the release build already passes `web-ext lint`.
3. **Source code**: answer **Yes** (the package is built with a bundler) and upload `punyguard-x.y.z-sources.zip`. Paste into the reviewer notes:

   > Build from the sources zip: install Node (version in `.nvmrc`) and pnpm 10.12.1, then run `pnpm install --frozen-lockfile && pnpm build:firefox`. The output in `apps/extension/.output/firefox-mv3` matches the uploaded package. All analysis is local; the add-on makes no network requests.

4. **Describe the add-on**:

   | Field          | Value                                                                                     |
   | -------------- | ----------------------------------------------------------------------------------------- |
   | Name           | PunyGuard                                                                                 |
   | Add-on URL     | `punyguard`                                                                               |
   | Summary        | The short description from [README.md](README.md#shared-text)                             |
   | Description    | The long description from README.md                                                       |
   | Categories     | Privacy & Security                                                                        |
   | Support site   | https://github.com/0xdolan/PunyGuard/issues                                               |
   | License        | GNU General Public License v3.0                                                           |
   | Privacy policy | Paste the text of [PRIVACY.md](../../PRIVACY.md) (AMO stores the policy text, not a link) |

5. Submit. Automated review usually signs the add-on within minutes to hours; a human review may follow.
6. After it is listed, add screenshots (the four `chrome-1280x800-*.png` work well) and the icon on the listing's **Edit Product Page**.

Already handled in the manifest: the add-on ID `punyguard@0xdolan` and `data_collection_permissions: none`, which Firefox 140+ requires for new add-ons.

## Automatic updates for new versions

After the first version is listed, every release tag submits itself to AMO:

1. Create an API key at https://addons.mozilla.org/developers/addon/api/key/ (the "JWT issuer" and "JWT secret").
2. Add them as repository secrets:

   ```bash
   gh secret set AMO_JWT_ISSUER   # paste the JWT issuer
   gh secret set AMO_JWT_SECRET   # paste the JWT secret
   ```

3. From then on, pushing a `vX.Y.Z` tag runs the **Publish to addons.mozilla.org** job in the Release workflow. It builds the Firefox package, uploads it with the sources zip and the version's changelog section as release notes, and Mozilla reviews and publishes it as usual. Prerelease tags (with a `-`) are not submitted.

AMO accepts each version number only once, so a re-run of the job for a version that was already submitted fails; that is expected. Without the secrets, the job is skipped with a notice.

## After approval

Set the listing URL (`https://addons.mozilla.org/firefox/addon/punyguard/`) in the `store` field for `firefox` in [apps/site/src/downloads.ts](../../apps/site/src/downloads.ts).
