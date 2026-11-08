import type { SQLiteDatabase } from "expo-sqlite";
import { BookStatus, DBBook, NewBook } from "@/utils/types";

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

export const findByGoogleId = (
  db: SQLiteDatabase,
  googleId: string,
): Promise<DBBook | null> =>
  db.getFirstAsync<DBBook>("SELECT * FROM books WHERE googleId = ?", [
    googleId,
  ]);

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

/**
 * Inserts already-validated books in a single transaction, skipping ones
 * already in the library (same Google ID, or same title and authors).
 * Either every insert lands or none do.
 */
export const insertBooksSkippingDuplicates = async (
  db: SQLiteDatabase,
  books: NewBook[],
): Promise<{ imported: number; duplicates: number }> => {
  let imported = 0;
  let duplicates = 0;

  await db.withTransactionAsync(async () => {
    for (const book of books) {
      const existing = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM books
          WHERE (googleId IS NOT NULL AND googleId = ?)
             OR (title = ? AND authors IS ?)`,
        [book.googleId ?? null, book.title, book.authors ?? null],
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
