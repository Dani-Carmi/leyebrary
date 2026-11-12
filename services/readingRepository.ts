import type { SQLiteDatabase } from "expo-sqlite";
import {
  BookStatus,
  DBBook,
  ReadingDates,
  ReadingSession,
} from "@/utils/types";
import { normalizeText } from "@/utils/text";
import { MAX_TAG_LENGTH } from "@/utils/validation";

// ---------------------------------------------------------------- Books

/** One library book with its tags, or null if it no longer exists. */
export const getLibraryBook = async (
  db: SQLiteDatabase,
  id: number,
): Promise<DBBook | null> => {
  const book = await db.getFirstAsync<DBBook>(
    "SELECT * FROM books WHERE id = ?",
    [id],
  );
  if (!book) return null;
  return { ...book, tags: await getBookTags(db, id) };
};

export const updateNotes = async (
  db: SQLiteDatabase,
  bookId: number,
  notes: string,
): Promise<void> => {
  await db.runAsync("UPDATE books SET notes = ? WHERE id = ?", [
    notes.trim() ? notes : null,
    bookId,
  ]);
};

// ------------------------------------------------------------- Sessions

export const getSessions = (
  db: SQLiteDatabase,
  bookId: number,
): Promise<ReadingSession[]> =>
  db.getAllAsync<ReadingSession>(
    `SELECT id, bookId, startedAt, finishedAt FROM reading_sessions
      WHERE bookId = ?
      ORDER BY COALESCE(startedAt, finishedAt) ASC, id ASC`,
    [bookId],
  );

export const addSession = async (
  db: SQLiteDatabase,
  bookId: number,
  dates: ReadingDates,
): Promise<number> => {
  const result = await db.runAsync(
    `INSERT INTO reading_sessions (bookId, startedAt, finishedAt, createdAt)
     VALUES (?, ?, ?, ?)`,
    [bookId, dates.startedAt, dates.finishedAt, new Date().toISOString()],
  );
  return result.lastInsertRowId;
};

export const updateSession = async (
  db: SQLiteDatabase,
  id: number,
  dates: ReadingDates,
): Promise<void> => {
  await db.runAsync(
    "UPDATE reading_sessions SET startedAt = ?, finishedAt = ? WHERE id = ?",
    [dates.startedAt, dates.finishedAt, id],
  );
};

export const deleteSession = async (
  db: SQLiteDatabase,
  id: number,
): Promise<void> => {
  await db.runAsync("DELETE FROM reading_sessions WHERE id = ?", [id]);
};

/**
 * Status implied by a book's read-throughs: Reading while one is open,
 * otherwise Read once any has been finished. Null when they imply nothing
 * (no dates yet), so the current status is kept.
 */
export const statusFromSessions = (
  sessions: ReadingDates[],
): BookStatus | null => {
  if (sessions.some((s) => s.startedAt && !s.finishedAt)) {
    return BookStatus.READING;
  }
  if (sessions.some((s) => s.finishedAt)) return BookStatus.READ;
  return null;
};

/** Applies `statusFromSessions`; returns the status the book now has. */
export const syncStatusFromSessions = async (
  db: SQLiteDatabase,
  bookId: number,
  current: BookStatus,
): Promise<BookStatus> => {
  const implied = statusFromSessions(await getSessions(db, bookId));
  if (!implied || implied === current) return current;
  await db.runAsync("UPDATE books SET status = ? WHERE id = ?", [
    implied,
    bookId,
  ]);
  return implied;
};

// ----------------------------------------------------------------- Tags

/** Trims, collapses spaces and drops a leading "#"; "" if nothing is left. */
export const cleanTagName = (name: string): string =>
  name
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_TAG_LENGTH);

export const getBookTags = async (
  db: SQLiteDatabase,
  bookId: number,
): Promise<string[]> => {
  const rows = await db.getAllAsync<{ name: string }>(
    `SELECT t.name FROM book_tags bt JOIN tags t ON t.id = bt.tagId
      WHERE bt.bookId = ? ORDER BY t.name COLLATE NOCASE`,
    [bookId],
  );
  return rows.map((r) => r.name);
};

/** Every tag in use, for suggestions. */
export const getAllTagNames = async (db: SQLiteDatabase): Promise<string[]> => {
  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM tags ORDER BY name COLLATE NOCASE",
  );
  return rows.map((r) => r.name);
};

/**
 * Tags a book. Tags are matched ignoring case and accents, so "Sci-fi" and
 * "sci-fi" are one tag; the first spelling used is kept.
 */
export const addTagToBook = async (
  db: SQLiteDatabase,
  bookId: number,
  rawName: string,
): Promise<void> => {
  const name = cleanTagName(rawName);
  const normalized = normalizeText(name);
  if (!normalized) return;
  await db.runAsync(
    "INSERT OR IGNORE INTO tags (name, normalized) VALUES (?, ?)",
    [name, normalized],
  );
  await db.runAsync(
    `INSERT OR IGNORE INTO book_tags (bookId, tagId)
     SELECT ?, id FROM tags WHERE normalized = ?`,
    [bookId, normalized],
  );
};

export const removeTagFromBook = async (
  db: SQLiteDatabase,
  bookId: number,
  name: string,
): Promise<void> => {
  await db.runAsync(
    `DELETE FROM book_tags WHERE bookId = ?
       AND tagId IN (SELECT id FROM tags WHERE normalized = ?)`,
    [bookId, normalizeText(name)],
  );
  await pruneUnusedTags(db);
};

/** Drops tags no book uses any more, so suggestions stay relevant. */
export const pruneUnusedTags = async (db: SQLiteDatabase): Promise<void> => {
  await db.runAsync(
    "DELETE FROM tags WHERE id NOT IN (SELECT tagId FROM book_tags)",
  );
};
