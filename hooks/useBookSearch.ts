import { searchBooks } from "@/services/googleBooksApi";
import { Book } from "@/utils/types";
import { useCallback, useEffect, useRef, useState } from "react";

/** Cancels the request held in `ref` and stores a fresh controller there. */
const replaceRequest = (ref: { current: AbortController | null }) => {
  ref.current?.abort();
  ref.current = new AbortController();
  return ref.current;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const useBookSearch = () => {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The query the current results belong to, and a controller for the
  // in-flight request so a newer search cancels an older one.
  const activeQuery = useRef("");
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => () => inFlight.current?.abort(), []);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) {
      inFlight.current?.abort();
      setBooks([]);
      setTotalItems(0);
      setError(null);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const controller = replaceRequest(inFlight);
    activeQuery.current = q;
    setLoading(true);
    setLoadingMore(false);
    setError(null);

    try {
      const page = await searchBooks(q, 0, controller.signal);
      if (controller.signal.aborted) return;
      setBooks(page.books);
      setTotalItems(page.totalItems);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(errorMessage(err));
      setBooks([]);
      setTotalItems(0);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [query]);

  const hasMore = books.length > 0 && books.length < totalItems;

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore || !activeQuery.current) return;

    const controller = replaceRequest(inFlight);
    setLoadingMore(true);

    try {
      const page = await searchBooks(
        activeQuery.current,
        books.length,
        controller.signal,
      );
      if (controller.signal.aborted) return;
      // Google sometimes repeats a volume across pages.
      setBooks((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...page.books.filter((b) => !seen.has(b.id))];
      });
      // Stop paging when a page comes back empty (totalItems is an estimate).
      setTotalItems(page.books.length === 0 ? books.length : page.totalItems);
    } catch {
      // Keep the results we have; the user can scroll again to retry.
    } finally {
      if (!controller.signal.aborted) setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, books.length]);

  const clearSearch = useCallback(() => {
    inFlight.current?.abort();
    activeQuery.current = "";
    setQuery("");
    setBooks([]);
    setTotalItems(0);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  return {
    query,
    setQuery,
    books,
    loading,
    loadingMore,
    hasMore,
    error,
    search,
    loadMore,
    clearSearch,
  };
};
