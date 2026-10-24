/**
 * IDN / Punycode conversion (RFC 3492 + IDNA / UTS #46 nontransitional).
 *
 * Encoder: Unicode labels → ACE (`xn--…`) via UTS #46 then Punycode.
 * Decoder: ACE labels → Unicode with IDNA validation.
 */
import { toAscii, toUnicode } from 'idna-uts46-hx';

export type IdnDirection = 'encode' | 'decode' | 'identity' | 'error';

export interface LabelConversion {
  input: string;
  output: string;
  isAce: boolean;
  isAsciiOnly: boolean;
  changed: boolean;
  error?: string;
}

export interface IdnConversion {
  input: string;
  unicode: string;
  ascii: string;
  direction: IdnDirection;
  labels: LabelConversion[];
  hasIdn: boolean;
  errors: string[];
}

const UTS46_OPTS = {
  transitional: false,
  useStd3ASCII: true,
  verifyDnsLength: true,
} as const;

function stripUrlish(raw: string): string {
  let host = raw.trim();
  if (!host) return '';
  try {
    if (host.includes('://')) host = new URL(host).hostname;
    else if (host.includes('/') && !host.startsWith('xn--')) {
      host = host.split('/')[0] ?? host;
    }
  } catch {
    /* keep */
  }
  return host.replace(/\.$/, '').toLowerCase();
}

function isAsciiLabel(label: string): boolean {
  for (const ch of label) {
    const cp = ch.codePointAt(0)!;
    if (cp > 0x7f) return false;
  }
  return true;
}

/** Encode a domain (or URL host) to DNS ASCII / Punycode ACE form. */
export function encodeToAscii(input: string): { ascii: string; error?: string } {
  const host = stripUrlish(input);
  if (!host) return { ascii: '', error: 'Empty input' };
  try {
    return { ascii: toAscii(host, UTS46_OPTS) };
  } catch (e) {
    return { ascii: host, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Decode a domain from ACE / Punycode to Unicode. */
export function decodeToUnicode(input: string): { unicode: string; error?: string } {
  const host = stripUrlish(input);
  if (!host) return { unicode: '', error: 'Empty input' };
  try {
    return { unicode: toUnicode(host, UTS46_OPTS) };
  } catch (e) {
    return { unicode: host, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Full bidirectional conversion with per-label breakdown.
 * Surfaces how lookalike Unicode maps to distinct `xn--` ACE labels.
 */
export function convertIdn(input: string): IdnConversion {
  const host = stripUrlish(input);
  const errors: string[] = [];
  if (!host) {
    return {
      input,
      unicode: '',
      ascii: '',
      direction: 'error',
      labels: [],
      hasIdn: false,
      errors: ['Empty input'],
    };
  }

  const enc = encodeToAscii(host);
  const dec = decodeToUnicode(host);
  if (enc.error) errors.push(`encode: ${enc.error}`);
  if (dec.error) errors.push(`decode: ${dec.error}`);

  const ascii = enc.ascii || host;
  const unicode = dec.unicode || host;
  const hasIdn = ascii.includes('xn--') || unicode !== ascii;

  const inputLabels = host.split('.');
  const asciiLabels = ascii.split('.');
  const unicodeLabels = unicode.split('.');
  const n = Math.max(inputLabels.length, asciiLabels.length, unicodeLabels.length);

  const labels: LabelConversion[] = [];
  for (let i = 0; i < n; i++) {
    const inp = inputLabels[i] ?? '';
    const ace = asciiLabels[i] ?? inp;
    const uni = unicodeLabels[i] ?? inp;
    const isAce = inp.startsWith('xn--') || ace.startsWith('xn--');
    const isAsciiOnly = isAsciiLabel(inp) && !inp.startsWith('xn--');
    // Prefer showing round-trip: input ACE → unicode display, else unicode → ACE
    const output = inp.startsWith('xn--') ? uni : ace;
    labels.push({
      input: inp,
      output,
      isAce,
      isAsciiOnly,
      changed: inp !== output,
    });
  }

  let direction: IdnDirection = 'identity';
  if (errors.length && ascii === host && unicode === host) direction = 'error';
  else if (host.includes('xn--') && unicode !== host) direction = 'decode';
  else if (!isAsciiLabel(host.replace(/\./g, '')) || ascii !== host) direction = 'encode';
  else if (hasIdn) direction = host.includes('xn--') ? 'decode' : 'encode';

  return {
    input: host,
    unicode,
    ascii,
    direction,
    labels,
    hasIdn,
    errors,
  };
}

/** True if any label uses the ACE prefix `xn--`. */
export function hasAcePrefix(hostname: string): boolean {
  return stripUrlish(hostname)
    .split('.')
    .some((l) => l.startsWith('xn--'));
}
