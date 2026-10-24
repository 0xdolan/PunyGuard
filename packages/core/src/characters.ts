import unicodeProps from 'unicode-properties';
import { CONFUSABLE_TO_LATIN } from './confusables';
import { blockNameFor } from './blocks';
import { getCharacterName } from './names';

export interface CharDetail {
  index: number;
  char: string;
  display: string;
  codePoint: number;
  uPlus: string;
  hex: string;
  hexPadded: string;
  decimal: number;
  name: string;
  block: string;
  script: string;
  category: string;
  categoryLabel: string;
  combiningClass: number;
  bidiClass: string;
  htmlEscape: string;
  urlEscape: string;
  jsEscape: string;
  utf8Hex: string;
  utf16Hex: string;
  isInvisible: boolean;
  isControl: boolean;
  isHomoglyph: boolean;
  homoglyphLatin: string | null;
  isAscii: boolean;
  isNonAscii: boolean;
  unicodeOrgUrl: string;
  utilUnicodeUrl: string;
  searchable: string;
}

export interface DomainCharReport {
  input: string;
  normalizedHost: string | null;
  characters: CharDetail[];
  invisibleCount: number;
  homoglyphCount: number;
  nonAsciiCount: number;
  controlCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  Lu: 'Letter, uppercase',
  Ll: 'Letter, lowercase',
  Lt: 'Letter, titlecase',
  Lm: 'Letter, modifier',
  Lo: 'Letter, other',
  Mn: 'Mark, nonspacing',
  Mc: 'Mark, spacing combining',
  Me: 'Mark, enclosing',
  Nd: 'Number, decimal digit',
  Nl: 'Number, letter',
  No: 'Number, other',
  Pc: 'Punctuation, connector',
  Pd: 'Punctuation, dash',
  Ps: 'Punctuation, open',
  Pe: 'Punctuation, close',
  Pi: 'Punctuation, initial quote',
  Pf: 'Punctuation, final quote',
  Po: 'Punctuation, other',
  Sm: 'Symbol, math',
  Sc: 'Symbol, currency',
  Sk: 'Symbol, modifier',
  So: 'Symbol, other',
  Zs: 'Separator, space',
  Zl: 'Separator, line',
  Zp: 'Separator, paragraph',
  Cc: 'Other, control',
  Cf: 'Other, format',
  Cs: 'Other, surrogate',
  Co: 'Other, private use',
  Cn: 'Other, not assigned',
};

const INVISIBLE_EXTRA = new Set([
  0x00ad, // soft hyphen
  0x034f, // combining grapheme joiner
  0x061c, // arabic letter mark
  0x180e, // mongolian vowel separator
  0x200b,
  0x200c,
  0x200d,
  0x200e,
  0x200f,
  0x202a,
  0x202b,
  0x202c,
  0x202d,
  0x202e,
  0x2060,
  0x2061,
  0x2062,
  0x2063,
  0x2064,
  0x2066,
  0x2067,
  0x2068,
  0x2069,
  0xfeff, // bom / zwnbsp
  0xfff9,
  0xfffa,
  0xfffb,
]);

function toUtf8Hex(cp: number): string {
  const s = String.fromCodePoint(cp);
  const bytes = new TextEncoder().encode(s);
  return [...bytes].map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

function toUtf16Hex(cp: number): string {
  if (cp <= 0xffff) return cp.toString(16).toUpperCase().padStart(4, '0');
  const adj = cp - 0x10000;
  const hi = 0xd800 + (adj >> 10);
  const lo = 0xdc00 + (adj & 0x3ff);
  return `${hi.toString(16).toUpperCase()} ${lo.toString(16).toUpperCase()}`;
}

function displayGlyph(cp: number, category: string): string {
  if (category === 'Cc' || category === 'Cf' || INVISIBLE_EXTRA.has(cp) || cp < 0x20) {
    return '·';
  }
  if (category === 'Zs') return '␣';
  try {
    return String.fromCodePoint(cp);
  } catch {
    return '�';
  }
}

export function analyzeCodePoint(cp: number, index = 0): CharDetail {
  const char = String.fromCodePoint(cp);
  const category: string = unicodeProps.getCategory(cp) || 'Cn';
  const script: string = unicodeProps.getScript(cp) || 'Unknown';
  const combiningClass: number = unicodeProps.getCombiningClass?.(cp) ?? 0;
  // unicode-properties may not expose bidi; derive simple heuristic
  const bidiClass =
    category === 'Cf' && cp >= 0x202a && cp <= 0x202e
      ? 'Bidi control'
      : script === 'Arabic' || script === 'Hebrew'
        ? 'R/AL'
        : 'L';

  let name = getCharacterName(cp) ?? '';
  if (!name) {
    if (category === 'Cc') name = `<control-${cp.toString(16).toUpperCase().padStart(4, '0')}>`;
    else
      name = `CODE POINT U+${cp
        .toString(16)
        .toUpperCase()
        .padStart(cp > 0xffff ? 5 : 4, '0')}`;
  }

  const hex = cp.toString(16).toUpperCase();
  const hexPadded = hex.padStart(cp > 0xffff ? 5 : 4, '0');
  const uPlus = `U+${hexPadded}`;
  const block = blockNameFor(cp);
  const isControl = category === 'Cc';
  const isInvisible =
    isControl ||
    category === 'Cf' ||
    category === 'Zl' ||
    category === 'Zp' ||
    INVISIBLE_EXTRA.has(cp) ||
    (category === 'Zs' && cp !== 0x20);
  const mapped = CONFUSABLE_TO_LATIN.get(cp) ?? null;
  const isHomoglyph = mapped != null && mapped !== char;
  const isAscii = cp <= 0x7f;

  const detail: CharDetail = {
    index,
    char,
    display: displayGlyph(cp, category),
    codePoint: cp,
    uPlus,
    hex,
    hexPadded,
    decimal: cp,
    name,
    block,
    script,
    category,
    categoryLabel: CATEGORY_LABELS[category] ?? category,
    combiningClass,
    bidiClass,
    htmlEscape: `&#x${hex};`,
    urlEscape: isAscii && /^[A-Za-z0-9._~-]$/.test(char) ? char : encodeURIComponent(char),
    jsEscape: cp <= 0xffff ? `\\u${hexPadded}` : `\\u{${hex}}`,
    utf8Hex: toUtf8Hex(cp),
    utf16Hex: toUtf16Hex(cp),
    isInvisible,
    isControl,
    isHomoglyph,
    homoglyphLatin: mapped,
    isAscii,
    isNonAscii: !isAscii,
    unicodeOrgUrl: `https://util.unicode.org/UnicodeJsps/character.jsp?a=${hexPadded}`,
    utilUnicodeUrl: `https://www.unicode.org/charts/PDF/U${hexPadded.slice(0, -2).padStart(4, '0') || '0000'}.pdf`,
    searchable: '',
  };

  detail.searchable = [
    detail.char,
    detail.display,
    detail.uPlus,
    detail.hex,
    detail.hexPadded,
    String(detail.decimal),
    detail.name,
    detail.block,
    detail.script,
    detail.category,
    detail.categoryLabel,
    detail.htmlEscape,
    detail.jsEscape,
    detail.utf8Hex,
    detail.isInvisible ? 'invisible control format zwsp' : '',
    detail.isHomoglyph ? `homoglyph ${detail.homoglyphLatin}` : '',
  ]
    .join(' ')
    .toLowerCase();

  return detail;
}

/** Expand a string into per-code-point details (handles surrogates via codePointAt). */
export function analyzeString(input: string): CharDetail[] {
  const out: CharDetail[] = [];
  let i = 0;
  let index = 0;
  while (i < input.length) {
    const cp = input.codePointAt(i)!;
    out.push(analyzeCodePoint(cp, index++));
    i += cp > 0xffff ? 2 : 1;
  }
  return out;
}

export function analyzeDomainCharacters(raw: string): DomainCharReport {
  const trimmed = raw.trim();
  let host = trimmed;
  try {
    if (trimmed.includes('://')) host = new URL(trimmed).hostname;
    else if (trimmed.includes('/') && !trimmed.startsWith('xn--')) {
      host = trimmed.split('/')[0] ?? trimmed;
    }
  } catch {
    /* keep raw */
  }

  const characters = analyzeString(host);
  return {
    input: trimmed,
    normalizedHost: host || null,
    characters,
    invisibleCount: characters.filter((c) => c.isInvisible).length,
    homoglyphCount: characters.filter((c) => c.isHomoglyph).length,
    nonAsciiCount: characters.filter((c) => c.isNonAscii).length,
    controlCount: characters.filter((c) => c.isControl).length,
  };
}

export function filterCharacters(chars: CharDetail[], query: string): CharDetail[] {
  const q = query.trim().toLowerCase();
  if (!q) return chars;
  const normalized = q.replace(/^u\+/, '').replace(/^0x/, '');
  return chars.filter(
    (c) =>
      c.searchable.includes(q) ||
      c.hexPadded.toLowerCase().includes(normalized) ||
      c.uPlus.toLowerCase().includes(q),
  );
}

export function formatCharListClipboard(chars: CharDetail[]): string {
  return chars
    .map(
      (c) =>
        `${c.hexPadded} ${c.name}${c.isControl || c.isInvisible ? ' [control/invisible]' : ''}`,
    )
    .join('\n');
}
