import type { SQLiteDatabase } from "expo-sqlite";
import { Book, BookStatus, DBBook, NewBook } from "@/utils/types";

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
];

export const migrateDatabase = async (db: SQLiteDatabase): Promise<void> => {
  await db.execAsync("PRAGMA journal_mode = WAL;");
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

const INSERT_SQL = `INSERT INTO books (googleId, title, subtitle, authors, publisher, publishedDate, description, pageCount, categories, smallThumbnail, thumbnail, status, createdAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
];

export const getAllBooks = (db: SQLiteDatabase): Promise<DBBook[]> =>
  db.getAllAsync<DBBook>("SELECT * FROM books");

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
  await db.runAsync("DELETE FROM books WHERE id = ?", [id]);
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
  books: NewBook[],
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
      await db.runAsync(INSERT_SQL, insertParams(book));
      imported++;
    }
  });

  return { imported, duplicates };
};
