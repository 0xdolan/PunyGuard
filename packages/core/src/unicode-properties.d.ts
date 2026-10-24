declare module 'unicode-properties' {
  interface UnicodeProperties {
    getCategory(codePoint: number): string;
    getCombiningClass(codePoint: number): number;
    getScript(codePoint: number): string;
    getEastAsianWidth(codePoint: number): string;
    getNumericValue(codePoint: number): number | null;
    isAlphabetic(codePoint: number): boolean;
    isDigit(codePoint: number): boolean;
    isPunctuation(codePoint: number): boolean;
    isLowerCase(codePoint: number): boolean;
    isUpperCase(codePoint: number): boolean;
    isTitleCase(codePoint: number): boolean;
    isWhiteSpace(codePoint: number): boolean;
    isBaseForm(codePoint: number): boolean;
    isMark(codePoint: number): boolean;
  }
  const unicodeProps: UnicodeProperties;
  export default unicodeProps;
}
