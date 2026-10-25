# 3.3 Homograph attacks

An **IDN homograph attack** registers a domain whose Unicode form looks like a trusted domain, using confusable characters from other scripts ([2.3](../02-tricky-unicode/03-confusables-and-scripts.md)). The victim sees `apple.com`; the browser connects to `xn--80ak6aa92e.com`.

## A short history

| Year | Event                                                                                                                                                                                            |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2002 | Evgeniy Gabrilovich and Alex Gontmakher publish "The Homograph Attack", registering a lookalike of `microsoft.com` with Cyrillic letters.                                                        |
| 2005 | A Punycode lookalike of `paypal.com` is shown to fool the browsers of the time; browsers start adding display rules.                                                                             |
| 2017 | Xudong Zheng registers `xn--80ak6aa92e.com`, which displayed as `аррӏе.com` (all Cyrillic) in Chrome and Firefox, and gets a valid HTTPS certificate for it. Browsers tighten their rules again. |
| 2021 | Trojan Source (CVE-2021-42574, CVE-2021-42694) brings the same ideas to source code ([2.4](../02-tricky-unicode/04-bidirectional-text.md)).                                                      |

## Anatomy of an attack

Take `pаypal.com` with a Cyrillic `а` (U+0430):

```text
What the victim reads:   pаypal.com
Code points:             p U+0430 y p a l . c o m
DNS name (A-label):      xn--pypal-4ve.com
Owner:                   whoever registered xn--pypal-4ve.com
TLS certificate:         valid; certificate authorities issue them for any registered name
```

Every security indicator the victim might check (the padlock, the certificate, a professional-looking page) is real. Only the identity is false.

### Kinds of lookalike labels

| Kind                | Example (displayed)            | Scripts          | Hard to catch because                                                                |
| ------------------- | ------------------------------ | ---------------- | ------------------------------------------------------------------------------------ |
| Mixed-script        | `pаypal.com`                   | Latin + Cyrillic | Easy: mixing scripts in one label is rare                                            |
| Whole-script        | `аррӏе.com`                    | Cyrillic only    | Single-script, so mixed-script checks pass it                                        |
| Diacritic lookalike | `ápple.com`                    | Latin only       | Legitimate Latin letters; looks close at small sizes                                 |
| Same-script (ASCII) | `paypa1.com`, `rnicrosoft.com` | Latin only       | Not Unicode at all; no IDN rule applies                                              |
| Normalizes away     | `ｇｏｏｇｌｅ.com`             | Fullwidth Latin  | Not an attack on the domain: IDNA maps it to `google.com`, but it fools text filters |

## How browsers respond

Browsers decide, per hostname, whether to show the Unicode form or the `xn--` form in the address bar. The rules differ between browsers and change over time, but they share ideas from UTS #39:

- Show `xn--` when a label **mixes scripts** in a non-approved way (for example Latin + Cyrillic).
- Show `xn--` for **whole-script confusables** where the label is made only of letters that look Latin, especially under non-matching TLDs (Cyrillic-only `аррӏе` under `.com`).
- Compare the label's **skeleton** against a list of popular domains and show `xn--` on a match.
- Block certain characters outright (invisible characters, many symbols).

Chromium documents its policy at https://chromium.googlesource.com/chromium/src/+/main/docs/idn.md. In Firefox you can force every IDN to display as Punycode by setting `network.IDN_show_punycode` to `true` in `about:config`.

These rules apply only to the **address bar**. Link text in a page, the text of an email, a chat message, or a QR code preview can show any Unicode the sender wants. That gap is what PunyGuard covers: it checks every hostname a page links to, not just the one you are on ([5.1](../05-how-punyguard-works/01-architecture.md)).

## Beyond web addresses

The same confusables appear wherever names identify things:

- **Email**: sender domains and display names.
- **Usernames and display names** on social platforms.
- **Package names** in npm, PyPI, and other registries (homoglyph typosquatting).
- **File names**, combined with the bidi tricks from [2.4](../02-tricky-unicode/04-bidirectional-text.md).
- **Source code identifiers**, covered in [4.2](../04-invisible-code/02-attacks-in-source-and-config.md).

## Defenses

For individuals:

| Defense                        | Why it works                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------- |
| Passkeys / FIDO2 security keys | The credential is bound to the real origin and is never offered to a lookalike    |
| A password manager's autofill  | It matches the stored domain exactly; if it does not offer to fill, stop and look |
| Bookmarks for important sites  | You never type or click an untrusted link to reach them                           |
| Show Punycode in the browser   | Firefox `network.IDN_show_punycode`; makes every IDN visibly different            |
| A checker such as PunyGuard    | Flags lookalike links before you click them                                       |

For organizations:

- **Register obvious lookalikes** of your main domains defensively.
- **Monitor Certificate Transparency** logs (for example via https://crt.sh/) for certificates whose skeleton matches your brand. Tools like `dnstwist` generate homoglyph and typo permutations of a domain to check.
- **Normalize and skeleton-check** user-chosen names (usernames, project names, package names) at registration time, not only at display time.

## Try it

Classify each hostname as mixed-script, whole-script, or harmless, then check your answers in PunyGuard's inspector (popup → Inspect, or https://0xdolan.github.io/PunyGuard/#/inspect):

1. `xn--pypal-4ve.com`
2. `xn--80ak6aa92e.com`
3. `xn--mnchen-3ya.de`

---

Previous: [3.2 IDN and Punycode](02-idn-and-punycode.md) · Next: [4.1 Hiding data in invisible characters](../04-invisible-code/01-hiding-data-in-invisible-characters.md)
