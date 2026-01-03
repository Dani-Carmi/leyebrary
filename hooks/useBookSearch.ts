import { searchBooks } from "@/services/googleBooksApi";
import { Book } from "@/utils/types";
import { useCallback, useState } from "react";

export const useBookSearch = () => {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async () => {
    if (!query.trim()) {
      setBooks([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchBooks(query);
      setBooks(response.items || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setBooks([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    books,
    loading,
    error,
    search,
    clearSearch,
  };
};
