import type { SQLiteDatabase } from "expo-sqlite";
import {
  Book,
  BookStatus,
  DBBook,
  NewBook,
  PortableBook,
  ReadingDates,
} from "@/utils/types";
import { addTagToBook, pruneUnusedTags } from "./readingRepository";

export const DATABASE_NAME = "booksdatabase.db";

/**
 * Ordered schema migrations. Each entry moves the database from version
 * `index` to `index + 1` (tracked with `PRAGMA user_version`). Never edit an
 * entry that has shipped; append a new one instead.
 */
const MIGRATIONS: string[] = [
  // v1: original schema (already present on existing installs).
  `CREATE TABLE IF NOT EXISTS books (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     title TEXT NOT NULL,
     subtitle TEXT NULL,
     authors TEXT NULL,
     publisher TEXT NULL,
     publishedDate DATE NULL,
     description TEXT NULL,
     pageCount INTEGER NULL,
     categories TEXT NULL,
     smallThumbnail TEXT NULL,
     thumbnail TEXT NULL,
     status TEXT CHECK(status IN ('TO_READ', 'READING', 'READ')) DEFAULT 'TO_READ' NOT NULL,
     createdAt TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
   );`,
  // v2: track the Google volume ID so a book can't be added twice, and store
  // createdAt as ISO 8601 UTC (CURRENT_TIMESTAMP has no zone and no "T").
  `ALTER TABLE books ADD COLUMN googleId TEXT NULL;
   CREATE UNIQUE INDEX IF NOT EXISTS idx_books_googleId ON books(googleId);
   UPDATE books
      SET createdAt = COALESCE(strftime('%Y-%m-%dT%H:%M:%fZ', createdAt), createdAt)
    WHERE createdAt NOT LIKE '%T%';`,
  // v3: local search cache for autocomplete. `normalized`/`searchText` are
  // lowercased, accent-free copies used for matching (see normalizeText).
  `CREATE TABLE IF NOT EXISTS search_history (
     normalized TEXT PRIMARY KEY,
     query TEXT NOT NULL,
     useCount INTEGER NOT NULL DEFAULT 1,
     lastUsedAt TEXT NOT NULL,
     results TEXT NULL,
     totalItems INTEGER NULL,
     resultsFetchedAt TEXT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_search_history_lastUsedAt
     ON search_history(lastUsedAt);
   CREATE TABLE IF NOT EXISTS seen_volumes (
     googleId TEXT PRIMARY KEY,
     searchText TEXT NOT NULL,
     data TEXT NOT NULL,
     lastSeenAt TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_seen_volumes_lastSeenAt
     ON seen_volumes(lastSeenAt);`,
  // v4: reading data for library books: notes, read-throughs and tags.
  // Session dates are local calendar days (YYYY-MM-DD).
  `ALTER TABLE books ADD COLUMN notes TEXT NULL;
   CREATE TABLE IF NOT EXISTS reading_sessions (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     bookId INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
     startedAt TEXT NULL,
     finishedAt TEXT NULL,
     createdAt TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_reading_sessions_bookId
     ON reading_sessions(bookId);
   CREATE TABLE IF NOT EXISTS tags (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     name TEXT NOT NULL,
     normalized TEXT NOT NULL UNIQUE
   );
   CREATE TABLE IF NOT EXISTS book_tags (
     bookId INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
     tagId INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
     PRIMARY KEY (bookId, tagId)
   );`,
];

export const migrateDatabase = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync("PRAGMA journal_mode = WAL;");
  // Off by default in SQLite; needed for ON DELETE CASCADE to apply.
  await db.execAsync("PRAGMA foreign_keys = ON;");
  const row = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version",
  );
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const next = version + 1;
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      // PRAGMA doesn't accept bound parameters; `next` is a trusted integer.
      await db.execAsync(`PRAGMA user_version = ${next}`);
    });
    version = next;
  }
};

const INSERT_SQL = `INSERT INTO books (googleId, title, subtitle, authors, publisher, publishedDate, description, pageCount, categories, smallThumbnail, thumbnail, status, createdAt, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const insertParams = (book: NewBook) => [
  book.googleId ?? null,
  book.title,
  book.subtitle ?? null,
  book.authors ?? null,
  book.publisher ?? null,
  book.publishedDate ?? null,
  book.description ?? null,
  book.pageCount ?? null,
  book.categories ?? null,
  book.smallThumbnail ?? null,
  book.thumbnail ?? null,
  book.status,
  book.createdAt,
  book.notes ?? null,
];

/** Every library book, with its tags. */
export const getAllBooks = async (db: SQLiteDatabase): Promise<DBBook[]> => {
  const [books, tagRows] = await Promise.all([
    db.getAllAsync<DBBook>("SELECT * FROM books"),
    db.getAllAsync<{ bookId: number; name: string }>(
      `SELECT bt.bookId, t.name FROM book_tags bt JOIN tags t ON t.id = bt.tagId
        ORDER BY t.name COLLATE NOCASE`,
    ),
  ]);
  const tagsByBook = new Map<number, string[]>();
  for (const { bookId, name } of tagRows) {
    tagsByBook.set(bookId, [...(tagsByBook.get(bookId) ?? []), name]);
  }
  return books.map((b) => ({ ...b, tags: tagsByBook.get(b.id) ?? [] }));
};

/** Every book with its read-throughs and tags, ready for a backup file. */
export const getBackupBooks = async (
  db: SQLiteDatabase,
): Promise<PortableBook[]> => {
  const [books, sessions] = await Promise.all([
    getAllBooks(db),
    db.getAllAsync<ReadingDates & { bookId: number }>(
      `SELECT bookId, startedAt, finishedAt FROM reading_sessions
        ORDER BY COALESCE(startedAt, finishedAt) ASC, id ASC`,
    ),
  ]);
  const readingsByBook = new Map<number, ReadingDates[]>();
  for (const { bookId, startedAt, finishedAt } of sessions) {
    readingsByBook.set(bookId, [
      ...(readingsByBook.get(bookId) ?? []),
      { startedAt, finishedAt },
    ]);
  }
  // Database row IDs are local to this install; leave them out of backups.
  return books.map(({ id, tags, ...book }) => ({
    ...book,
    readings: readingsByBook.get(id) ?? [],
    tags: tags ?? [],
  }));
};

/**
 * What identifies a book in the library: the same Google volume, or the same
 * title and authors (catches other editions of a book already saved).
 */
export type LibraryMatch = {
  googleId: string | null;
  title: string;
  authors: string | null; // Comma-separated, as stored
};

export const libraryMatchFor = (book: Book): LibraryMatch => ({
  googleId: book.id,
  title: book.volumeInfo.title,
  authors: book.volumeInfo.authors?.join(", ") ?? null,
});

const DUPLICATE_WHERE = `(googleId IS NOT NULL AND googleId = ?)
   OR (title = ? AND authors IS ?)`;

const duplicateParams = (match: LibraryMatch) => [
  match.googleId ?? null,
  match.title,
  match.authors ?? null,
];

export const findInLibrary = (
  db: SQLiteDatabase,
  match: LibraryMatch,
): Promise<DBBook | null> =>
  db.getFirstAsync<DBBook>(
    `SELECT * FROM books WHERE ${DUPLICATE_WHERE}
      ORDER BY CASE WHEN googleId = ? THEN 0 ELSE 1 END
      LIMIT 1`,
    [...duplicateParams(match), match.googleId ?? null],
  );

export type LibraryKeyRow = LibraryMatch & { status: BookStatus };

export const getLibraryKeys = (db: SQLiteDatabase): Promise<LibraryKeyRow[]> =>
  db.getAllAsync<LibraryKeyRow>(
    "SELECT googleId, title, authors, status FROM books",
  );

export const isDuplicateBookError = (error: unknown): boolean =>
  String(error instanceof Error ? error.message : error).includes(
    "UNIQUE constraint failed",
  );

export const addBook = async (
  db: SQLiteDatabase,
  book: NewBook,
): Promise<number> => {
  const result = await db.runAsync(INSERT_SQL, insertParams(book));
  return result.lastInsertRowId;
};

export const deleteBook = async (db: SQLiteDatabase, id: number) => {
  // Explicit as well as ON DELETE CASCADE, in case foreign keys are off.
  await db.runAsync("DELETE FROM reading_sessions WHERE bookId = ?", [id]);
  await db.runAsync("DELETE FROM book_tags WHERE bookId = ?", [id]);
  await db.runAsync("DELETE FROM books WHERE id = ?", [id]);
  await pruneUnusedTags(db);
};

export const updateBookStatus = async (
  db: SQLiteDatabase,
  id: number,
  status: BookStatus,
) => {
  await db.runAsync("UPDATE books SET status = ? WHERE id = ?", [status, id]);
};

export const insertBooksSkippingDuplicates = async (
  db: SQLiteDatabase,
  books: PortableBook[],
): Promise<{ imported: number; duplicates: number }> => {
  let imported = 0;
  let duplicates = 0;

  await db.withTransactionAsync(async () => {
    for (const book of books) {
      const existing = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM books WHERE ${DUPLICATE_WHERE}`,
        duplicateParams({
          googleId: book.googleId ?? null,
          title: book.title,
          authors: book.authors ?? null,
        }),
      );
      if (existing) {
        duplicates++;
        continue;
      }
      const { lastInsertRowId: bookId } = await db.runAsync(
        INSERT_SQL,
        insertParams(book),
      );
      for (const reading of book.readings) {
        await db.runAsync(
          `INSERT INTO reading_sessions (bookId, startedAt, finishedAt, createdAt)
           VALUES (?, ?, ?, ?)`,
          [bookId, reading.startedAt, reading.finishedAt, book.createdAt],
        );
      }
      for (const tag of book.tags) await addTagToBook(db, bookId, tag);
      imported++;
    }
  });

  return { imported, duplicates };
};
