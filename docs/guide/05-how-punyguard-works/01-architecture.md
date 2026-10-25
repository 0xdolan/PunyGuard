# 5.1 Architecture

PunyGuard is a browser extension (Chrome, Edge, Brave, Firefox, Safari) plus a static website, both built on one detection engine. Everything runs locally: no page content, hostname, or setting ever leaves the browser.

## Repository layout

```text
packages/core/       The detection engine (TypeScript, no browser APIs, no network)
  src/idn.ts           IDNA / UTS #46 conversion: Unicode <-> xn-- (uses idna-uts46-hx)
  src/domain.ts        Hostname normalization, label split, registrable domain, HTML host extraction
  src/confusables.ts   Homoglyph table and script classification
  src/analyze.ts       Per-hostname scoring, page scan, badge state
  src/characters.ts    Per-code-point details for the inspector
  src/blocks.ts        Unicode block names
  src/names.ts         Character names
  src/table.ts         Sorting and filtering for the character table
apps/extension/      The WXT + React browser extension
  src/entrypoints/content.ts      Runs in pages, collects hostnames
  src/entrypoints/background.ts   Scores hostnames, stores results per tab, sets the badge
  src/entrypoints/popup/          Toolbar popup: page results and inspector
  src/entrypoints/options/        Settings page
  src/entrypoints/analyzer/       Full-page inspector in a tab
apps/site/           GitHub Pages site with the same inspector
```

The engine is a plain library, so the extension, the website, and the unit tests all run exactly the same code.

## How a page scan flows

```text
 Web page (every frame)                    Background                         Toolbar
 ─────────────────────                     ──────────                         ───────
 content.ts                                background.ts
  1. collect hostnames from links,   ──►   3. scanHostnames(hosts)            5. badge: red count,
     scripts, iframes, forms, images,         └ analyzeHostname(each)            amber count, or ✓
     and a sample of the page HTML          4. merge into the tab's result
  2. send PAGE_HOSTS message                   in storage.session
  (again on DOM changes, debounced)                 │
                                                    ▼
                                           popup asks GET_SCAN ──► list of domains with level,
                                                                   reasons, and an Inspect button
```

### 1. Collecting hostnames (content script)

The content script runs at `document_idle` in every frame (subframes can be turned off with the **Scan iframes** setting). It gathers hosts from:

- The page's own `location.hostname`.
- Attributes of `a[href]`, `script[src]`, `iframe[src]`, `embed[src]`, `object[data]`, `link[href]`, `form[action]`, and `img[src]`, resolved against the page URL. Only `http:` and `https:` URLs count.
- The first 250,000 characters of the page HTML, searched by `extractHostnamesFromHtml` for URLs in attributes, plain `https://` URLs in text, and bare hostnames that contain non-ASCII letters or an `xn--` label (so a lookalike mentioned in text is caught even if it is not a link).

A `MutationObserver` repeats the collection 1.2 seconds after the DOM changes, so content added by scripts is covered.

### 2-4. Scoring and storing (background)

The background script receives the list, scores each unique hostname with `analyzeHostname` ([5.2](02-domain-detection-pipeline.md)), and merges the result into the tab's stored result. Reports from several frames add up rather than replace each other. Results live in `storage.session`, so they survive the browser unloading the background script and disappear when the browser closes. A new navigation clears the tab's result.

### 5. The badge

| Badge        | Meaning                                       |
| ------------ | --------------------------------------------- |
| red number   | Count of hostnames rated **danger**           |
| amber number | No danger; count of hostnames rated **watch** |
| green ✓      | Hostnames were found and all are **safe**     |
| `off` (grey) | Protection is switched off                    |

### The popup and the inspector

The popup asks the background for the current tab's result and lists the hostnames (safe ones only if **Show safe domains** is on). Each entry shows its level, first reason, and score; clicking it opens the **Inspect** tab with that hostname. The inspector shows the IDN conversion, the per-character table, and the details covered in [5.3](03-character-inspector.md). The same inspector is available full-page in the extension (analyzer) and on the website.

## Settings

| Setting           | Default | Effect                                   |
| ----------------- | ------- | ---------------------------------------- |
| Enabled           | on      | Master switch for scanning and the badge |
| Theme             | system  | Light, dark, or follow the system        |
| Show safe domains | off     | Include safe hostnames in the popup list |
| Scan iframes      | on      | Run the content script in subframes too  |
| Toolbar badge     | on      | Show counts on the toolbar icon          |

## Privacy and permissions

| Permission               | Why                                                  |
| ------------------------ | ---------------------------------------------------- |
| `<all_urls>` host access | Run the content script on pages you visit            |
| `tabs`, `activeTab`      | Know which tab a result belongs to; read the tab URL |
| `scripting`              | Content script injection                             |
| `storage`                | Settings and per-tab results                         |

The engine has no network code. IDNA conversion, confusable lookup, and scoring are all local table lookups, which is why a full page scan typically takes a few milliseconds (the popup shows the time).

---

Previous: [4.3 Detection and defense](../04-invisible-code/03-detection-and-defense.md) · Next: [5.2 Domain detection pipeline](02-domain-detection-pipeline.md)
