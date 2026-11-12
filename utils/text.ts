/**
 * Lowercases, strips accents and collapses whitespace, so "Perché  Dune"
 * matches "perche dune". Used for search history and suggestion matching.
 */
export const normalizeText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

export const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, (c) => `\\${c}`);
