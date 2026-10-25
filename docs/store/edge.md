# Microsoft Edge Add-ons

Shared text and assets are in [README.md](README.md).

## One-time setup

Register at https://partner.microsoft.com/dashboard/microsoftedge (free, Microsoft account required).

## Submit

1. **Create new extension** → upload `punyguard-x.y.z-edge.zip`.
2. **Availability**: Public, all markets.
3. **Properties**:

   | Field           | Value                                                 |
   | --------------- | ----------------------------------------------------- |
   | Category        | Productivity (Edge has no security category)          |
   | Privacy policy  | Yes: https://0xdolan.github.io/PunyGuard/privacy.html |
   | Website         | https://0xdolan.github.io/PunyGuard/                  |
   | Support contact | https://github.com/0xdolan/PunyGuard/issues           |
   | Mature content  | No                                                    |

4. **Store listings** (English):

   | Field             | Value                                                                                                |
   | ----------------- | ---------------------------------------------------------------------------------------------------- |
   | Description       | The long description from [README.md](README.md#shared-text) (Edge requires at least 250 characters) |
   | Extension logo    | `assets/store/icons/icon-300.png` (300x300)                                                          |
   | Small promo tile  | `assets/store/promo/chrome-promo-small-440x280.png`                                                  |
   | Screenshots       | The four `assets/store/screenshots/chrome-1280x800-*.png`                                            |
   | Short description | The short description from README.md                                                                 |

5. **Submit**, with the reviewer notes from [chrome.md](chrome.md#reviewer-notes-optional-field) in **Notes for certification**. Review usually takes up to 7 business days.

## After approval

Set the listing URL in the `store` field for `edge` in [apps/site/src/downloads.ts](../../apps/site/src/downloads.ts).
