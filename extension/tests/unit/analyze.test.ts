import { describe, expect, it } from 'vitest';
import {
  analyzeDomainCharacters,
  analyzeHostname,
  badgeState,
  filterCharacters,
  scanHostnames,
  deconstructDomain,
  extractHostnamesFromHtml,
} from '@punyguard/core';

describe('analyzeHostname', () => {
  it('marks plain ASCII domains as safe', () => {
    const t = analyzeHostname('example.com');
    expect(t?.level).toBe('safe');
    expect(t?.score).toBe(0);
  });

  it('flags Cyrillic lookalike paypal', () => {
    const host = 'раypal.com';
    const t = analyzeHostname(host);
    expect(t).not.toBeNull();
    expect(t!.hasHomoglyphs || t!.mixedScript || t!.level !== 'safe').toBe(true);
    expect(t!.score).toBeGreaterThan(0);
  });

  it('detects punycode IDN', () => {
    const t = analyzeHostname('xn--pple-43d.com');
    expect(t?.isPunycode).toBe(true);
    expect(['watch', 'danger']).toContain(t!.level);
  });

  it('detects mixed Latin + Cyrillic scripts', () => {
    const t = analyzeHostname('gооgle.com');
    expect(t?.mixedScript || t?.hasHomoglyphs).toBe(true);
    expect(t!.level).not.toBe('safe');
  });

  it('finishes a multi-host scan quickly', () => {
    const hosts = [
      'example.com',
      'github.com',
      'xn--pple-43d.com',
      'раypal.com',
      'google.com',
      'cdn.example.org',
    ];
    const result = scanHostnames(hosts, 'example.com');
    expect(result.durationMs).toBeLessThan(5);
    expect(result.counts.total).toBeGreaterThan(0);
  });
});

describe('character inspector', () => {
  it('reports U+ and formal names', () => {
    const report = analyzeDomainCharacters('list');
    expect(report.characters).toHaveLength(4);
    expect(report.characters[0]?.uPlus).toBe('U+006C');
    expect(report.characters[0]?.name).toMatch(/LATIN SMALL LETTER L/i);
    expect(report.characters[0]?.block).toBe('Basic Latin');
    expect(report.characters[0]?.decimal).toBe(108);
  });

  it('flags invisible characters', () => {
    const report = analyzeDomainCharacters('a\u200Bb.com');
    expect(report.invisibleCount).toBeGreaterThan(0);
  });

  it('filters by U+ and name', () => {
    const report = analyzeDomainCharacters('Hi');
    const byU = filterCharacters(report.characters, 'U+0048');
    expect(byU).toHaveLength(1);
    const byName = filterCharacters(report.characters, 'LATIN SMALL LETTER I');
    expect(byName.some((c) => c.char === 'i')).toBe(true);
  });
});

describe('badgeState', () => {
  it('uses red for danger counts', () => {
    const result = scanHostnames(['раypal.com', 'example.com']);
    const badge = badgeState({
      ...result,
      counts: { ...result.counts, danger: 2, watch: 0 },
    });
    expect(badge.color).toBe('#DC2626');
    expect(badge.text).toBe('2');
  });

  it('uses amber for watch-only', () => {
    const badge = badgeState({
      pageHost: 'x.com',
      threats: [],
      counts: { safe: 1, watch: 3, danger: 0, total: 4 },
      scannedAt: Date.now(),
      durationMs: 0.5,
    });
    expect(badge.color).toBe('#D97706');
    expect(badge.text).toBe('3');
  });
});

describe('domain utils', () => {
  it('deconstructs multi-part TLDs', () => {
    const parts = deconstructDomain('api.docs.example.co.uk');
    expect(parts?.tld).toBe('co.uk');
    expect(parts?.sld).toBe('example');
    expect(parts?.subdomains).toEqual(['api', 'docs']);
  });

  it('extracts hosts from HTML attributes', () => {
    const html = `
      <a href="https://evil.example/phish">x</a>
      <script src="//cdn.lookalike.test/a.js"></script>
      <iframe src="https://xn--pple-43d.com/login"></iframe>
    `;
    const hosts = extractHostnamesFromHtml(html);
    expect(hosts).toContain('evil.example');
    expect(hosts).toContain('cdn.lookalike.test');
    expect(hosts).toContain('xn--pple-43d.com');
  });
});
