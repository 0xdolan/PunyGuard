# 3.1 How domain names work

Before looking at Unicode in domain names, you need the vocabulary for the ASCII parts, because most phishing tricks, Unicode or not, exploit how people misread the structure of a hostname.

## Labels

A hostname is a list of **labels** separated by dots, read from right to left in order of authority:

```text
     login . paypal . co . uk
     ^^^^^   ^^^^^^   ^^^^^^^
  subdomain   SLD    public suffix (TLD)
             ^^^^^^^^^^^^^^^^
             registrable domain
```

| Term                | Meaning                                                                 | In `login.paypal.co.uk`       |
| ------------------- | ----------------------------------------------------------------------- | ----------------------------- |
| Label               | One dot-separated part                                                  | `login`, `paypal`, `co`, `uk` |
| TLD / public suffix | The part under which anyone can register names                          | `co.uk`                       |
| SLD                 | The label directly left of the public suffix: the name someone bought   | `paypal`                      |
| Registrable domain  | SLD plus public suffix (also called eTLD+1). This is who owns the site. | `paypal.co.uk`                |
| Subdomains          | Everything left of the registrable domain, chosen freely by the owner   | `login`                       |

DNS rules for classic hostnames:

- Each label is 1 to 63 characters; the whole name is at most 253.
- Allowed characters are letters, digits, and hyphen (the **LDH** rule). A label cannot start or end with a hyphen.
- Names are case-insensitive: `EXAMPLE.com` and `example.com` are the same.
- A trailing dot (`example.com.`) marks a fully qualified name and means the same host.

## The public suffix problem

The registrable domain is not always "the last two labels":

| Hostname                 | Public suffix | Registrable domain  |
| ------------------------ | ------------- | ------------------- |
| `a.b.example.com`        | `com`         | `example.com`       |
| `login.paypal.co.uk`     | `co.uk`       | `paypal.co.uk`      |
| `shop.example.github.io` | `github.io`   | `example.github.io` |

`github.io` is a suffix because GitHub lets anyone create `<name>.github.io`, so `example.github.io` and `attacker.github.io` belong to different people. The authoritative list of such suffixes is the **Public Suffix List** (https://publicsuffix.org/), with thousands of entries. PunyGuard ships a small built-in subset ([5.4](../05-how-punyguard-works/04-limitations-and-roadmap.md)).

## Structural tricks (no Unicode needed)

Attackers rely on people reading a hostname from the left:

| Trick                | Example                                 | Who really owns it                               |
| -------------------- | --------------------------------------- | ------------------------------------------------ |
| Brand as a subdomain | `paypal.com.secure-login.example`       | `secure-login.example`                           |
| Userinfo in a URL    | `https://paypal.com@evil.example/login` | `evil.example` (`paypal.com` is just a username) |
| Typosquatting        | `paypa1.com`, `gooogle.com`             | whoever registered it                            |
| Combosquatting       | `paypal-security.com`                   | whoever registered it                            |
| TLD swap             | `paypal.co` instead of `paypal.com`     | whoever registered it                            |

You can check with a real URL parser:

```js
new URL('https://paypal.com@evil.example/login').hostname; // 'evil.example'
```

**Rule:** find the public suffix, then read the one label to its left. That label and the suffix are the registrable domain, and they are the only part that tells you who you are talking to.

## Where Unicode comes in

Everything above assumes ASCII labels. Internationalized domain names (next page) allow labels like `münchen` or `例え`, and with them, labels that look exactly like a brand but are spelled with other alphabets. The structure tricks and the Unicode tricks combine: `аpple.com.example` is a Cyrillic lookalike placed as a subdomain.

## Try it

For each hostname, write down the registrable domain:

1. `accounts.google.com.verify-session.net`
2. `www.bbc.co.uk`
3. `xn--80ak6aa92e.com`

(Answers: `verify-session.net`, `bbc.co.uk`, and `xn--80ak6aa92e.com`, whose Unicode form you will decode on the next page.)

---

Previous: [2.4 Bidirectional text](../02-tricky-unicode/04-bidirectional-text.md) · Next: [3.2 IDN and Punycode](02-idn-and-punycode.md)
