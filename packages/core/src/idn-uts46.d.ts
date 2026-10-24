declare module 'idna-uts46-hx' {
  export interface Uts46Options {
    transitional?: boolean;
    useStd3ASCII?: boolean;
    verifyDnsLength?: boolean;
  }

  export function toAscii(domain: string, options?: Uts46Options): string;
  export function toUnicode(domain: string, options?: Uts46Options): string;
  export function convert(domain: string, options?: Uts46Options): string;
}
