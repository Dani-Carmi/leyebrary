import type { SQLiteDatabase } from "expo-sqlite";
import { Book } from "@/utils/types";
import { sanitizeVolume } from "@/utils/validation";
import { escapeLike, normalizeText } from "@/utils/text";

/** A repeated search within this window is served from the device. */
const RESULTS_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_HISTORY = 200;
const MAX_VOLUMES = 1000;
const RECENT_LIMIT = 5;
const QUERY_SUGGESTION_LIMIT = 4;
const BOOK_SUGGESTION_LIMIT = 5;

export type CachedSearch = { books: Book[]; totalItems: number };
export type SearchSuggestions = { queries: string[]; books: Book[] };

const volumeSearchText = (book: Book) =>
  normalizeText(
    [book.volumeInfo.title, ...(book.volumeInfo.authors ?? [])].join(" "),
  );

const parseVolume = (json: string): Book | null => {
  try {
    return sanitizeVolume(JSON.parse(json));
  } catch {
    return null;
  }
};

export const rememberVolumes = async (
  db: SQLiteDatabase,
  books: Book[],
): Promise<void> => {
  if (books.length === 0) return;
  const now = new Date().toISOString();
  // One multi-row upsert: atomic without a transaction, so it can't clash
  // with other writes running at the same time.
  await db.runAsync(
    `INSERT INTO seen_volumes (googleId, searchText, data, lastSeenAt)
     VALUES ${books.map(() => "(?, ?, ?, ?)").join(", ")}
     ON CONFLICT(googleId) DO UPDATE SET
       searchText = excluded.searchText,
       data = excluded.data,
       lastSeenAt = excluded.lastSeenAt`,
    books.flatMap((b) => [b.id, volumeSearchText(b), JSON.stringify(b), now]),
  );
  await db.runAsync(
    `DELETE FROM seen_volumes WHERE googleId NOT IN (
       SELECT googleId FROM seen_volumes ORDER BY lastSeenAt DESC LIMIT ?)`,
    [MAX_VOLUMES],
  );
};

/** Records a search that returned results, plus its first page for reuse. */
export const recordSearch = async (
  db: SQLiteDatabase,
  query: string,
  page: CachedSearch,
): Promise<void> => {
  const normalized = normalizeText(query);
  if (!normalized || page.books.length === 0) return;
  await rememberVolumes(db, page.books);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO search_history
       (normalized, query, useCount, lastUsedAt, results, totalItems, resultsFetchedAt)
     VALUES (?, ?, 1, ?, ?, ?, ?)
     ON CONFLICT(normalized) DO UPDATE SET
       query = excluded.query,
       useCount = useCount + 1,
       lastUsedAt = excluded.lastUsedAt,
       results = excluded.results,
       totalItems = excluded.totalItems,
       resultsFetchedAt = excluded.resultsFetchedAt`,
    [
      normalized,
      query.trim(),
      now,
      JSON.stringify(page.books.map((b) => b.id)),
      page.totalItems,
      now,
    ],
  );
  await db.runAsync(
    `DELETE FROM search_history WHERE normalized NOT IN (
       SELECT normalized FROM search_history ORDER BY lastUsedAt DESC LIMIT ?)`,
    [MAX_HISTORY],
  );
};

export const getCachedSearch = async (
  db: SQLiteDatabase,
  query: string,
): Promise<CachedSearch | null> => {
  const normalized = normalizeText(query);
  const row = await db.getFirstAsync<{
    results: string | null;
    totalItems: number | null;
    resultsFetchedAt: string | null;
  }>(
    `SELECT results, totalItems, resultsFetchedAt
       FROM search_history WHERE normalized = ?`,
    [normalized],
  );
  if (!row?.results || !row.resultsFetchedAt) return null;
  const fetchedAt = Date.parse(row.resultsFetchedAt);
  if (!(Date.now() - fetchedAt < RESULTS_TTL_MS)) return null;

  let ids: unknown;
  try {
    ids = JSON.parse(row.results);
  } catch {
    return null;
  }
  if (!Array.isArray(ids) || ids.length === 0) return null;

  const rows = await db.getAllAsync<{ googleId: string; data: string }>(
    `SELECT googleId, data FROM seen_volumes
      WHERE googleId IN (${ids.map(() => "?").join(", ")})`,
    ids.map(String),
  );
  const byId = new Map(rows.map((r) => [r.googleId, parseVolume(r.data)]));
  const books = ids.map((id) => byId.get(String(id)) ?? null);
  if (books.some((b) => b === null)) return null;

  await db.runAsync(
    `UPDATE search_history
        SET useCount = useCount + 1, lastUsedAt = ?
      WHERE normalized = ?`,
    [new Date().toISOString(), normalized],
  );
  return { books: books as Book[], totalItems: row.totalItems ?? books.length };
};

export const getSeenVolume = async (
  db: SQLiteDatabase,
  googleId: string,
): Promise<Book | null> => {
  const row = await db.getFirstAsync<{ data: string }>(
    "SELECT data FROM seen_volumes WHERE googleId = ?",
    [googleId],
  );
  return row ? parseVolume(row.data) : null;
};

/**
 * Suggestions for what's typed so far: matching past searches and books
 * seen in results. Matches at the start of the text rank first, then at the
 * start of a word, then anywhere. With nothing typed, recent searches.
 */
export const getSearchSuggestions = async (
  db: SQLiteDatabase,
  text: string,
): Promise<SearchSuggestions> => {
  const normalized = normalizeText(text);
  if (!normalized) {
    const recent = await db.getAllAsync<{ query: string }>(
      "SELECT query FROM search_history ORDER BY lastUsedAt DESC LIMIT ?",
      [RECENT_LIMIT],
    );
    return { queries: recent.map((r) => r.query), books: [] };
  }

  const term = escapeLike(normalized);
  const contains = `%${term}%`;
  const prefix = `${term}%`;
  const wordPrefix = `% ${term}%`;
  const rank = (column: string) =>
    `CASE WHEN ${column} LIKE ? ESCAPE '\\' THEN 0
          WHEN ${column} LIKE ? ESCAPE '\\' THEN 1
          ELSE 2 END`;

  const [queries, books] = await Promise.all([
    db.getAllAsync<{ query: string }>(
      `SELECT query FROM search_history
        WHERE normalized LIKE ? ESCAPE '\\'
        ORDER BY ${rank("normalized")}, useCount DESC, lastUsedAt DESC
        LIMIT ?`,
      [contains, prefix, wordPrefix, QUERY_SUGGESTION_LIMIT],
    ),
    db.getAllAsync<{ data: string }>(
      `SELECT data FROM seen_volumes
        WHERE searchText LIKE ? ESCAPE '\\'
        ORDER BY ${rank("searchText")}, lastSeenAt DESC
        LIMIT ?`,
      [contains, prefix, wordPrefix, BOOK_SUGGESTION_LIMIT],
    ),
  ]);

  return {
    queries: queries.map((r) => r.query),
    books: books
      .map((r) => parseVolume(r.data))
      .filter((b): b is Book => b !== null),
  };
};

/** Forgets every past search and every saved result. */
export const clearSearchHistory = async (db: SQLiteDatabase): Promise<void> => {
  await db.runAsync("DELETE FROM search_history");
  await db.runAsync("DELETE FROM seen_volumes");
};
