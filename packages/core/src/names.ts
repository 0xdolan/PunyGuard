import compact from './names-compact';

const NAME_BY_HEX = compact as Record<string, string>;

/** Formal Unicode name when available in the compact (domain-relevant) table. */
export function getCharacterName(cp: number): string | null {
  const hex = cp.toString(16);
  return NAME_BY_HEX[hex] ?? NAME_BY_HEX[hex.toLowerCase()] ?? null;
}
