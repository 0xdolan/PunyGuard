import { CONFUSABLE_TO_LATIN, ScriptBit, popcount, scriptBitForCodePoint } from './confusables';
import { deconstructDomain, normalizeHostname } from './domain';
import { convertIdn, decodeToUnicode, encodeToAscii, hasAcePrefix } from './idn';

export type ThreatLevel = 'safe' | 'watch' | 'danger';

export interface DomainThreat {
  hostname: string;
  /** Unicode / U-label form (human-readable). */
  unicodeHostname: string;
  /** DNS ASCII / A-label form (`xn--…` where needed). */
  asciiHostname: string;
  level: ThreatLevel;
  score: number;
  reasons: string[];
  isPunycode: boolean;
  mixedScript: boolean;
  hasHomoglyphs: boolean;
  skeleton: string;
  scripts: string[];
  parts: {
    tld: string;
    sld: string;
    registrable: string;
    subdomains: string[];
  };
}

export interface ScanResult {
  pageHost: string | null;
  threats: DomainThreat[];
  counts: { safe: number; watch: number; danger: number; total: number };
  scannedAt: number;
  durationMs: number;
}

const SCRIPT_NAMES: Record<number, string> = {
  [ScriptBit.Latin]: 'Latin',
  [ScriptBit.Cyrillic]: 'Cyrillic',
  [ScriptBit.Greek]: 'Greek',
  [ScriptBit.Arabic]: 'Arabic',
  [ScriptBit.Hebrew]: 'Hebrew',
  [ScriptBit.Han]: 'Han',
  [ScriptBit.Hangul]: 'Hangul',
  [ScriptBit.Hiragana]: 'Hiragana',
  [ScriptBit.Katakana]: 'Katakana',
  [ScriptBit.Thai]: 'Thai',
  [ScriptBit.Devanagari]: 'Devanagari',
  [ScriptBit.Armenian]: 'Armenian',
  [ScriptBit.Other]: 'Other',
};

/** Decode a single DNS label (ACE → Unicode) via UTS #46. */
function decodeLabel(label: string): string {
  if (!label.startsWith('xn--')) return label;
  const { unicode, error } = decodeToUnicode(label);
  return error ? label : unicode;
}

export function toUnicodeHostname(hostname: string): string {
  const { unicode, error } = decodeToUnicode(hostname);
  if (!error && unicode) return unicode;
  return hostname.split('.').map(decodeLabel).join('.');
}

export function toAsciiHostname(hostname: string): string {
  const { ascii, error } = encodeToAscii(hostname);
  if (!error && ascii) return ascii;
  return hostname;
}

export function skeletonize(label: string): { skeleton: string; homoglyphCount: number } {
  let skeleton = '';
  let homoglyphCount = 0;
  for (const ch of label) {
    const cp = ch.codePointAt(0)!;
    const mapped = CONFUSABLE_TO_LATIN.get(cp);
    if (mapped) {
      skeleton += mapped;
      if (mapped !== ch) homoglyphCount++;
    } else if (cp <= 0x7f) {
      skeleton += ch.toLowerCase();
    } else {
      skeleton += ch;
    }
  }
  return { skeleton, homoglyphCount };
}

function scriptsInLabel(label: string): { mask: number; names: string[] } {
  let mask = 0;
  for (const ch of label) {
    const cp = ch.codePointAt(0)!;
    if ((cp >= 0x30 && cp <= 0x39) || cp === 0x2d) continue;
    mask |= scriptBitForCodePoint(cp);
  }
  const names = Object.entries(SCRIPT_NAMES)
    .filter(([bit]) => (mask & Number(bit)) !== 0)
    .map(([, name]) => name);
  return { mask, names };
}

function scoreLabel(
  label: string,
  reasons: string[],
): {
  score: number;
  mixedScript: boolean;
  hasHomoglyphs: boolean;
  skeleton: string;
  scripts: string[];
} {
  let score = 0;
  const unicode = decodeLabel(label);
  const { skeleton, homoglyphCount } = skeletonize(unicode);
  const { mask, names } = scriptsInLabel(unicode);
  const scriptCount = popcount(mask & ~ScriptBit.Other);
  const mixedScript = scriptCount >= 2;
  const hasHomoglyphs = homoglyphCount > 0;
  const isPuny = label.startsWith('xn--') || unicode !== label;

  if (isPuny) {
    score += 25;
    reasons.push('Punycode / IDN (ACE xn--) label present');
  }
  if (hasHomoglyphs) {
    score += Math.min(40, 15 + homoglyphCount * 8);
    reasons.push(`Homoglyph characters detected (${homoglyphCount})`);
  }
  if (mixedScript) {
    score += 35;
    reasons.push(`Mixed scripts: ${names.join(' + ')}`);
  }
  if (/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/.test(unicode)) {
    score += 50;
    reasons.push('Invisible / bidirectional control characters');
  }
  const nonAscii = [...unicode].filter((c) => (c.codePointAt(0) ?? 0) > 0x7f).length;
  if (nonAscii > 0 && nonAscii / Math.max(unicode.length, 1) > 0.4 && !mixedScript) {
    score += 10;
    reasons.push('High non-ASCII density');
  }

  return { score, mixedScript, hasHomoglyphs, skeleton, scripts: names };
}

export function analyzeHostname(rawHost: string): DomainThreat | null {
  const hostname = normalizeHostname(rawHost);
  if (!hostname) return null;

  const parts = deconstructDomain(hostname);
  if (!parts) return null;

  const idn = convertIdn(hostname);
  const unicodeHostname = idn.unicode || toUnicodeHostname(hostname);
  const asciiHostname = idn.ascii || toAsciiHostname(hostname);
  const reasons: string[] = [];
  let score = 0;
  let mixedScript = false;
  let hasHomoglyphs = false;
  let skeleton = '';
  const scripts = new Set<string>();
  const isPunycode = hasAcePrefix(hostname) || hasAcePrefix(asciiHostname) || idn.hasIdn;

  if (idn.errors.length) {
    reasons.push(`IDNA validation: ${idn.errors[0]}`);
    score += 20;
  }

  // Score on Unicode labels (decoded) so homoglyphs in ACE form still surface
  const labelsToScore = unicodeHostname.split('.');
  for (let i = 0; i < labelsToScore.length; i++) {
    const unicodeLabel = labelsToScore[i]!;
    const aceLabel = asciiHostname.split('.')[i] ?? unicodeLabel;
    const result = scoreLabel(aceLabel.startsWith('xn--') ? aceLabel : unicodeLabel, reasons);
    score += result.score;
    mixedScript = mixedScript || result.mixedScript;
    hasHomoglyphs = hasHomoglyphs || result.hasHomoglyphs;
    if (i === labelsToScore.length - 2 || unicodeLabel === parts.sld) {
      skeleton = result.skeleton || skeleton;
    }
    result.scripts.forEach((s) => scripts.add(s));
  }

  if (hasHomoglyphs && /^[a-z0-9-]+$/.test(skeleton) && skeleton.length >= 3) {
    score += 15;
    reasons.push(`ASCII skeleton: “${skeleton}”`);
  }

  // Distinct ACE form is a phishing tell when Unicode looks brand-like
  if (idn.hasIdn && asciiHostname !== unicodeHostname) {
    reasons.push(`ACE form: ${asciiHostname}`);
  }

  score = Math.min(100, score);
  let level: ThreatLevel = 'safe';
  if (score >= 55 || (mixedScript && hasHomoglyphs)) level = 'danger';
  else if (score >= 20 || isPunycode || hasHomoglyphs || mixedScript) level = 'watch';

  if (level === 'safe' && reasons.length === 0) {
    reasons.push('No homograph indicators');
  }

  return {
    hostname,
    unicodeHostname,
    asciiHostname,
    level,
    score,
    reasons: [...new Set(reasons)],
    isPunycode,
    mixedScript,
    hasHomoglyphs,
    skeleton,
    scripts: [...scripts],
    parts: {
      tld: parts.tld,
      sld: parts.sld,
      registrable: parts.registrable,
      subdomains: parts.subdomains,
    },
  };
}

export function scanHostnames(hosts: string[], pageHost?: string | null): ScanResult {
  const started = performance.now();
  // One entry per real domain: a lookalike seen as a link (xn-- form) and in page
  // text (Unicode form) is the same host, so key by the ASCII form.
  const byAscii = new Map<string, string>();
  for (const raw of hosts) {
    const host = normalizeHostname(raw);
    if (!host) continue;
    const key = toAsciiHostname(host);
    if (!byAscii.has(key)) byAscii.set(key, host);
  }
  const unique = [...byAscii.values()];
  const threats = unique
    .map(analyzeHostname)
    .filter((t): t is DomainThreat => t !== null)
    .sort((a, b) => b.score - a.score);

  const counts = {
    safe: threats.filter((t) => t.level === 'safe').length,
    watch: threats.filter((t) => t.level === 'watch').length,
    danger: threats.filter((t) => t.level === 'danger').length,
    total: threats.length,
  };

  return {
    pageHost: pageHost ? normalizeHostname(pageHost) : null,
    threats,
    counts,
    scannedAt: Date.now(),
    durationMs: performance.now() - started,
  };
}

export function badgeState(result: ScanResult | null): {
  text: string;
  color: string;
  level: ThreatLevel;
} {
  if (!result || result.counts.total === 0) {
    return { text: '', color: '#16A34A', level: 'safe' };
  }
  if (result.counts.danger > 0) {
    return {
      text: String(result.counts.danger),
      color: '#DC2626',
      level: 'danger',
    };
  }
  if (result.counts.watch > 0) {
    return {
      text: String(result.counts.watch),
      color: '#D97706',
      level: 'watch',
    };
  }
  return { text: '✓', color: '#16A34A', level: 'safe' };
}
