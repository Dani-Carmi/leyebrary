import { BooksApiError, searchBooks } from "@/services/googleBooksApi";
import {
  getCachedSearch,
  recordSearch,
  rememberVolumes,
} from "@/services/searchCache";
import { Book } from "@/utils/types";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

/** Cancels the request held in `ref` and stores a fresh controller there. */
const replaceRequest = (ref: { current: AbortController | null }) => {
  ref.current?.abort();
  ref.current = new AbortController();
  return ref.current;
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

// The search cache is a nice-to-have: if it fails, searching still works.
const logCacheError = (error: unknown) =>
  console.warn("Search cache unavailable:", error);

export const useBookSearch = () => {
  const db = useSQLiteContext();
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The last error would go away with an API key (none set, or a bad one).
  const [errorNeedsApiKey, setErrorNeedsApiKey] = useState(false);
  // The query the shown results belong to; null until a search finishes.
  // Lets the screen tell "nothing found" apart from "not searched yet".
  const [searchedQuery, setSearchedQuery] = useState<string | null>(null);

  // The query the current results belong to, and a controller for the
  // in-flight request so a newer search cancels an older one.
  const activeQuery = useRef("");
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => () => inFlight.current?.abort(), []);

  /** Searches for `text` (e.g. a tapped suggestion), or the typed query. */
  const search = useCallback(async (text?: string) => {
    if (text !== undefined) setQuery(text);
    const q = (text ?? query).trim();
    if (!q) {
      inFlight.current?.abort();
      setBooks([]);
      setTotalItems(0);
      setSearchedQuery(null);
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
      // A search repeated within a day comes from the device, not the API.
      const cached = await getCachedSearch(db, q).catch((err) => {
        logCacheError(err);
        return null;
      });
      if (controller.signal.aborted) return;
      if (cached) {
        setBooks(cached.books);
        setTotalItems(cached.totalItems);
        setSearchedQuery(q);
        return;
      }

      const page = await searchBooks(q, 0, controller.signal);
      if (controller.signal.aborted) return;
      setBooks(page.books);
      setTotalItems(page.totalItems);
      setSearchedQuery(q);
      recordSearch(db, q, page).catch(logCacheError);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(errorMessage(err));
      setErrorNeedsApiKey(err instanceof BooksApiError && err.needsApiKey);
      setBooks([]);
      setTotalItems(0);
      setSearchedQuery(null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [query, db]);

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
      rememberVolumes(db, page.books).catch(logCacheError);
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
  }, [loading, loadingMore, hasMore, books.length, db]);

  const clearSearch = useCallback(() => {
    inFlight.current?.abort();
    activeQuery.current = "";
    setQuery("");
    setBooks([]);
    setTotalItems(0);
    setSearchedQuery(null);
    setError(null);
    setLoading(false);
    setLoadingMore(false);
  }, []);

  return {
    query,
    searchedQuery,
    setQuery,
    books,
    loading,
    loadingMore,
    hasMore,
    error,
    errorNeedsApiKey,
    search,
    loadMore,
    clearSearch,
  };
};
