# 2.4 Bidirectional text

Arabic and Hebrew are written right to left; numbers and Latin words inside them run left to right. The **Unicode Bidirectional Algorithm** (UAX #9, https://www.unicode.org/reports/tr9/) decides the display order of mixed-direction text. Most of the time it works without help. When it needs help, invisible **bidi control characters** override it, and those controls can make text display in a different order than it is stored.

## Logical order versus display order

Text is stored in **logical order**, the order it is typed and read by a program. It is drawn in **display order**, which the bidi algorithm computes. For ordinary text the two agree in meaning. Bidi controls let them disagree.

## The control characters

| Code point | Abbr. | Name                       | Effect                                           |
| ---------- | ----- | -------------------------- | ------------------------------------------------ |
| U+200E     | LRM   | LEFT-TO-RIGHT MARK         | Invisible strong left-to-right character         |
| U+200F     | RLM   | RIGHT-TO-LEFT MARK         | Invisible strong right-to-left character         |
| U+061C     | ALM   | ARABIC LETTER MARK         | Like RLM, for Arabic                             |
| U+202A     | LRE   | LEFT-TO-RIGHT EMBEDDING    | Start a left-to-right embedding                  |
| U+202B     | RLE   | RIGHT-TO-LEFT EMBEDDING    | Start a right-to-left embedding                  |
| U+202C     | PDF   | POP DIRECTIONAL FORMATTING | End the last embedding or override               |
| U+202D     | LRO   | LEFT-TO-RIGHT OVERRIDE     | Force following characters left to right         |
| U+202E     | RLO   | RIGHT-TO-LEFT OVERRIDE     | Force following characters right to left         |
| U+2066     | LRI   | LEFT-TO-RIGHT ISOLATE      | Start an isolated left-to-right run              |
| U+2067     | RLI   | RIGHT-TO-LEFT ISOLATE      | Start an isolated right-to-left run              |
| U+2068     | FSI   | FIRST STRONG ISOLATE       | Start an isolate with direction from its content |
| U+2069     | PDI   | POP DIRECTIONAL ISOLATE    | End the last isolate                             |

All of them are category `Cf` and render as nothing.

## The classic trick: reversed file names

RLO reverses everything after it. A file stored as:

```text
invoice_\u202efdp.exe
```

is displayed by many file managers and mail clients as `invoice_exe.pdf`: the RLO makes `fdp.exe` draw as `exe.pdf`. The real extension is still `.exe`.

## Trojan Source (CVE-2021-42574)

In 2021, Nicholas Boucher and Ross Anderson showed that the same trick works in **source code** (https://trojansource.codes/). Compilers read logical order; humans read display order. By placing bidi controls inside strings and comments, an attacker can make code that reviewers read one way and the compiler runs another way.

The paper's "stretched string" example, written with escapes so you can see every control:

```python
access_level = "user"
if access_level != "user\u202e \u2066// Check if admin\u2069 \u2066":
    print("You are an admin.")
```

In an editor that applies the bidi algorithm, the controls rearrange the line so it reads like:

```python
if access_level != "user": # Check if admin
```

It looks like the `if` compares against `"user"` and the rest is a comment, so the admin message should never print. But the real string being compared is `"user\u202e \u2066// Check if admin\u2069 \u2066"`, which is never equal to `"user"`, so the condition is always true:

```text
$ python3 trojan.py
You are an admin.
```

The same paper's companion CVE-2021-42694 covers **homoglyph** identifiers in code, such as a function named with a Cyrillic `а` that shadows the Latin one ([2.3](03-confusables-and-scripts.md)).

## Variants

- **Early return**: an RLI inside a comment hides a `return` statement that appears to be part of the comment.
- **Commenting out**: code that appears to run is actually inside a comment.
- **Stretched strings**: as above, part of what looks like code is inside a string.

## Defenses

| Defense                 | How                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reject in CI            | Fail the build on U+202A-U+202E and U+2066-U+2069 in source files ([4.3](../04-invisible-code/03-detection-and-defense.md))                                               |
| Compiler warnings       | Rust (`text_direction_codepoint_in_literal` lint, deny by default) and GCC (`-Wbidi-chars`, on by default since GCC 12) warn about unbalanced or unexpected bidi controls |
| Code hosting            | GitHub shows a warning banner on files that contain bidirectional Unicode text                                                                                            |
| Editors                 | VS Code highlights invisible and bidi characters (`editor.unicodeHighlight.*` settings)                                                                                   |
| Allow-list where needed | If a project really needs RTL text in strings, use escapes (`\u202e`) instead of raw characters, so the control is visible in review                                      |

## Bidi in domain names

IDNA has a "Bidi rule" (RFC 5893) that restricts how right-to-left and left-to-right characters may mix inside a domain label, and bidi controls are not allowed in domain names at all. PunyGuard reports a hostname containing them as an IDNA validation failure plus "Invisible / bidirectional control characters" ([5.2](../05-how-punyguard-works/02-domain-detection-pipeline.md)).

## Try it

Save the example above with the escapes replaced by the real characters, then run it:

```bash
python3 -c 'open("trojan.py","w").write("access_level = \"user\"\nif access_level != \"user\u202e \u2066// Check if admin\u2069 \u2066\":\n    print(\"You are an admin.\")\n")'
python3 trojan.py
python3 docs/examples/unicode_scan.py trojan.py
```

Open `trojan.py` in your editor. Then compare what the scanner reports with what you see.

---

Previous: [2.3 Confusables and scripts](03-confusables-and-scripts.md) · Next: [3.1 How domain names work](../03-domains/01-domain-names.md)
