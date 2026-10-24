/**
 * Right-to-left subdomain deconstruction for TLD / SLD / label analysis.
 */

const MULTI_PART_TLDS = new Set([
  'co.uk',
  'org.uk',
  'ac.uk',
  'gov.uk',
  'com.au',
  'net.au',
  'org.au',
  'co.jp',
  'co.kr',
  'com.br',
  'com.cn',
  'com.tw',
  'com.hk',
  'co.in',
  'com.sg',
  'co.nz',
  'com.mx',
  'co.za',
  'com.tr',
  'github.io',
  'blogspot.com',
]);

export interface DomainParts {
  /** Original hostname (lowercased, no trailing dot). */
  hostname: string;
  /** Labels from left (subdomains) to right (TLD). */
  labels: string[];
  /** Public suffix / TLD profile (may be multi-part). */
  tld: string;
  /** Registrable second-level domain (e.g. example in example.com). */
  sld: string;
  /** Registrable domain (e.g. example.com). */
  registrable: string;
  /** Subdomain labels only (excluding SLD + TLD). */
  subdomains: string[];
}

export function normalizeHostname(input: string): string | null {
  try {
    let host = input.trim().toLowerCase();
    if (!host) return null;
    if (host.includes('://')) {
      host = new URL(host).hostname;
    } else if (host.includes('/')) {
      host = host.split('/')[0] ?? host;
    }
    host = host.replace(/\.$/, '');
    if (host.startsWith('[') && host.endsWith(']')) return null; // IPv6
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null; // IPv4
    if (!host.includes('.')) return null;
    return host;
  } catch {
    return null;
  }
}

export function deconstructDomain(hostname: string): DomainParts | null {
  const host = normalizeHostname(hostname);
  if (!host) return null;

  const labels = host.split('.').filter(Boolean);
  if (labels.length < 2) return null;

  const joined = labels.join('.');
  let tld = labels[labels.length - 1]!;
  let sldIndex = labels.length - 2;

  for (let i = 2; i <= Math.min(3, labels.length); i++) {
    const candidate = labels.slice(-i).join('.');
    if (MULTI_PART_TLDS.has(candidate)) {
      tld = candidate;
      sldIndex = labels.length - i - 1;
      break;
    }
  }

  if (sldIndex < 0) {
    return {
      hostname: joined,
      labels,
      tld,
      sld: labels[0]!,
      registrable: joined,
      subdomains: [],
    };
  }

  const sld = labels[sldIndex]!;
  const tldLabelCount = tld.split('.').length;
  const registrable = labels.slice(sldIndex).join('.');
  const subdomains = labels.slice(0, sldIndex);

  void tldLabelCount;

  return {
    hostname: joined,
    labels,
    tld,
    sld,
    registrable,
    subdomains,
  };
}

/** Extract hostnames from HTML / page text (anchors, scripts, iframes, plain URLs). */
export function extractHostnamesFromHtml(html: string): string[] {
  const found = new Set<string>();

  const attrRe =
    /(?:href|src|action|data-src|formaction)\s*=\s*["']\s*(https?:\/\/[^"'>\s]+|\/\/[^"'>\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(html)) !== null) {
    const raw = m[1]!;
    const url = raw.startsWith('//') ? `https:${raw}` : raw;
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (host) found.add(host);
    } catch {
      /* ignore */
    }
  }

  const plainRe = /https?:\/\/([a-z0-9.-]+\.[a-z.]{2,})(?:[/:?#]|$)/gi;
  while ((m = plainRe.exec(html)) !== null) {
    found.add(m[1]!.toLowerCase());
  }

  // Bare IDN / xn-- mentions in text
  const idnRe = /\b((?:xn--[a-z0-9-]+|[^\s/?:#]+\.)+[^\s/?:#.]{2,})\b/gi;
  while ((m = idnRe.exec(html)) !== null) {
    const candidate = m[1]!.toLowerCase().replace(/[),.;]+$/, '');
    const normalized = normalizeHostname(candidate);
    if (normalized) found.add(normalized);
  }

  return [...found];
}
