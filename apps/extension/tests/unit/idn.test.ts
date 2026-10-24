import { describe, expect, it } from 'vitest';
import { convertIdn, decodeToUnicode, encodeToAscii, analyzeHostname } from '@punyguard/core';

describe('IDN / Punycode (UTS #46)', () => {
  it('encodes Unicode IDN to ACE xn-- form', () => {
    const { ascii, error } = encodeToAscii('點看.com');
    expect(error).toBeUndefined();
    expect(ascii).toBe('xn--c1yn36f.com');
  });

  it('decodes ACE back to Unicode', () => {
    const { unicode, error } = decodeToUnicode('xn--c1yn36f.com');
    expect(error).toBeUndefined();
    expect(unicode).toBe('點看.com');
  });

  it('leaves plain ASCII unchanged', () => {
    const c = convertIdn('example.com');
    expect(c.ascii).toBe('example.com');
    expect(c.unicode).toBe('example.com');
    expect(c.hasIdn).toBe(false);
    expect(c.direction).toBe('identity');
  });

  it('tokenizes labels and maps IDN label only', () => {
    const c = convertIdn('點看.com');
    expect(c.labels).toHaveLength(2);
    expect(c.labels[0]?.output).toContain('xn--');
    expect(c.labels[1]?.input).toBe('com');
    expect(c.labels[1]?.changed).toBe(false);
  });

  it('produces distinct ACE for Cyrillic lookalike vs Latin', () => {
    const latin = encodeToAscii('apple.com').ascii;
    const cyrillicA = encodeToAscii('аpple.com').ascii; // Cyrillic а
    expect(latin).toBe('apple.com');
    expect(cyrillicA).not.toBe(latin);
    expect(cyrillicA.startsWith('xn--')).toBe(true);
  });

  it('analyzeHostname exposes both unicode and ascii forms', () => {
    const t = analyzeHostname('xn--c1yn36f.com');
    expect(t?.isPunycode).toBe(true);
    expect(t?.asciiHostname).toContain('xn--');
    expect(t?.unicodeHostname).toContain('點');
  });
});
