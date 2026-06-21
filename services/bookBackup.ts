import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import type { SQLiteDatabase } from "expo-sqlite";
import { BookStatus, DBBook } from "@/utils/types";

const EXPORT_FILENAME = "your-library.json";
const VALID_STATUSES = new Set<string>(Object.values(BookStatus));

function isValidBook(obj: unknown): obj is DBBook {
  if (!obj || typeof obj !== "object") return false;
  const b = obj as Record<string, unknown>;
  return (
    typeof b.title === "string" &&
    b.title.trim().length > 0 &&
    typeof b.status === "string" &&
    VALID_STATUSES.has(b.status)
  );
}

export const exportBooks = async (books: DBBook[]): Promise<void> => {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error("Sharing is not available on this device");
  }
  const file = new File(Paths.cache, EXPORT_FILENAME);
  file.write(JSON.stringify(books, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: "application/json",
    dialogTitle: "Export your library",
    UTI: "public.json",
  });
};

export const importBooks = async (
  db: SQLiteDatabase,
): Promise<{ imported: number; skipped: number } | null> => {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const pickedFile = new File(result.assets[0].uri);
  const contents = await pickedFile.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(contents);
  } catch {
    throw new Error("Invalid file: not valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid file: expected an array of books");
  }

  let imported = 0;
  let skipped = 0;

  for (const item of parsed) {
    if (!isValidBook(item)) {
      skipped++;
      continue;
    }

    const existing = db.getFirstSync<{ id: number }>(
      "SELECT id FROM books WHERE title = ? AND authors IS ?",
      [item.title, item.authors ?? null],
    );

    if (existing) {
      skipped++;
      continue;
    }

    db.runSync(
      `INSERT INTO books (title, subtitle, authors, publisher, publishedDate, description, pageCount, categories, smallThumbnail, thumbnail, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.title,
        item.subtitle ?? null,
        item.authors ?? null,
        item.publisher ?? null,
        item.publishedDate ?? null,
        item.description ?? null,
        item.pageCount ?? null,
        item.categories ?? null,
        item.smallThumbnail ?? null,
        item.thumbnail ?? null,
        item.status,
        item.createdAt ?? new Date().toISOString(),
      ],
    );
    imported++;
  }

  return { imported, skipped };
};
