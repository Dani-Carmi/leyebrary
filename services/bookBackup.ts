import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import type { SQLiteDatabase } from "expo-sqlite";
import { PortableBook } from "@/utils/types";
import { sanitizeImportedBook } from "@/utils/validation";
import { insertBooksSkippingDuplicates } from "./booksRepository";

const EXPORT_FILENAME = "your-library.json";
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const MAX_IMPORT_BOOKS = 10_000;

/** Shares a backup of the library, reading data included (see getBackupBooks). */
export const exportBooks = async (books: PortableBook[]): Promise<void> => {
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
  if (pickedFile.size > MAX_IMPORT_BYTES) {
    throw new Error("Invalid file: larger than 5 MB");
  }
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
  if (parsed.length > MAX_IMPORT_BOOKS) {
    throw new Error(`Invalid file: more than ${MAX_IMPORT_BOOKS} books`);
  }

  const valid: PortableBook[] = [];
  for (const item of parsed) {
    const book = sanitizeImportedBook(item);
    if (book) valid.push(book);
  }

  const { imported, duplicates } = await insertBooksSkippingDuplicates(
    db,
    valid,
  );
  return { imported, skipped: parsed.length - valid.length + duplicates };
};
