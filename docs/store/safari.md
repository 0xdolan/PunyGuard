# Safari: Mac App Store

Safari extensions ship inside a small macOS app. Shared text and assets are in [README.md](README.md).

## Requirements

- A Mac with Xcode.
- Apple Developer Program membership ($99 per year): https://developer.apple.com/programs/

## Prepare the Xcode project

1. Unzip `punyguard-x.y.z-safari-xcode.zip`, or run `pnpm safari:xcode` in the repository (project in `apps/extension/safari/`).
2. Open the `.xcodeproj`. For the app target and the extension target, under **Signing & Capabilities**, choose your team.
   - App bundle ID: `io.github.0xdolan.PunyGuard`
   - Extension bundle ID: must start with the app's, for example `io.github.0xdolan.PunyGuard.Extension`
3. Under **General**, set **Version** to the release version (for example `0.2.1`) and increase **Build** for every upload.
4. **App icon**: in the asset catalog's AppIcon, use `assets/store/icons/icon-1024.png` (transparent, which macOS allows). Xcode 15+ can generate the smaller sizes from the 1024 image.
5. If the project also contains an iOS target and you only want macOS, remove the iOS target. iOS app icons cannot be transparent.

## App Store Connect

1. https://appstoreconnect.apple.com → **Apps** → **+** → **New App**:

   | Field            | Value                         |
   | ---------------- | ----------------------------- |
   | Platform         | macOS                         |
   | Name             | PunyGuard                     |
   | Primary language | English (U.S.)                |
   | Bundle ID        | `io.github.0xdolan.PunyGuard` |
   | SKU              | `punyguard`                   |

2. **App Information**: category **Utilities** (secondary: Productivity), privacy policy URL https://0xdolan.github.io/PunyGuard/privacy.html.
3. **App Privacy** → Get Started → **No, we do not collect data from this app**. The label shows "Data Not Collected".
4. **Pricing**: Free.
5. **macOS App version** page:

   | Field            | Value                                                                     |
   | ---------------- | ------------------------------------------------------------------------- |
   | Screenshots      | The four `assets/store/screenshots/apple-2880x1800-*.png`                 |
   | Promotional text | Spot lookalike domains before you click. Every check runs on your Mac.    |
   | Description      | The long description from [README.md](README.md#shared-text)              |
   | Keywords         | phishing,homograph,punycode,IDN,lookalike,unicode,security,privacy,domain |
   | Support URL      | https://github.com/0xdolan/PunyGuard/issues                               |
   | Marketing URL    | https://0xdolan.github.io/PunyGuard/                                      |
   | Copyright        | 2026 Dolan                                                                |

6. **App Review Information** notes:

   > PunyGuard is a Safari web extension. After launching the app, open Safari → Settings → Extensions and enable PunyGuard, then allow it on all websites. Visit any page that links to xn--mzn-5cdb9f.com (displays as "amazon.com" with Cyrillic letters): the toolbar button shows a red count and its popup lists the domain. The extension makes no network requests and collects no data. No sign-in is required.

## Upload and submit

1. In Xcode: **Product → Archive**, then in the Organizer **Distribute App → App Store Connect → Upload**.
2. When processing finishes, select the build on the version page and **Add for Review** → **Submit to App Review**. Review usually takes 1 to 3 days.

## Outside the App Store

To distribute the app directly instead, sign it with a Developer ID certificate and notarize it (**Distribute App → Developer ID**). This also requires the Developer Program.
