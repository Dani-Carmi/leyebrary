import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import {
  getLibraryKeys,
  libraryMatchFor,
  LibraryKeyRow,
} from "@/services/booksRepository";
import { Book, BookStatus } from "@/utils/types";

const titleAuthorsKey = (title: string, authors: string | null) =>
  JSON.stringify([title, authors]);

export function useLibraryStatus(): (book: Book) => BookStatus | undefined {
  const db = useSQLiteContext();
  const [rows, setRows] = useState<LibraryKeyRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      getLibraryKeys(db)
        .then((result) => {
          if (!cancelled) setRows(result);
        })
        .catch((error) => console.error("Couldn't read library:", error));
      return () => {
        cancelled = true;
      };
    }, [db]),
  );

  return useMemo(() => {
    const byGoogleId = new Map<string, BookStatus>();
    const byTitleAuthors = new Map<string, BookStatus>();
    for (const row of rows) {
      if (row.googleId) byGoogleId.set(row.googleId, row.status);
      byTitleAuthors.set(titleAuthorsKey(row.title, row.authors), row.status);
    }
    return (book: Book) => {
      const match = libraryMatchFor(book);
      return (
        (match.googleId ? byGoogleId.get(match.googleId) : undefined) ??
        byTitleAuthors.get(titleAuthorsKey(match.title, match.authors))
      );
    };
  }, [rows]);
}
