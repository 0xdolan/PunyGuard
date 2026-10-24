import { test, expect } from '@playwright/test';
import {
  analyzeDomainCharacters,
  analyzeHostname,
  convertIdn,
  encodeToAscii,
  scanHostnames,
} from '../../../packages/core/src/index';

test('engine classifies known lookalike patterns', () => {
  const paypal = analyzeHostname('раypal.com');
  expect(paypal).not.toBeNull();
  expect(paypal!.level).not.toBe('safe');

  const scan = scanHostnames(['example.com', 'xn--pple-43d.com', 'github.com']);
  expect(scan.durationMs).toBeLessThan(5);
  expect(scan.counts.watch + scan.counts.danger).toBeGreaterThan(0);
});

test('character report uses U+ and formal names', () => {
  const report = analyzeDomainCharacters('list');
  expect(report.characters[0]?.uPlus).toBe('U+006C');
  expect(report.characters[0]?.name).toMatch(/LATIN SMALL LETTER L/i);
});

test('IDN encode/decode round-trip', () => {
  const { ascii } = encodeToAscii('點看.com');
  expect(ascii).toBe('xn--c1yn36f.com');
  const idn = convertIdn(ascii!);
  expect(idn.unicode).toBe('點看.com');
  expect(idn.hasIdn).toBe(true);
});
