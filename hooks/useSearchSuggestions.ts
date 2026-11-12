import { useCallback, useEffect, useRef, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import {
  clearSearchHistory,
  getSearchSuggestions,
  SearchSuggestions,
} from "@/services/searchCache";

type Loaded = SearchSuggestions & {
  showingRecent: boolean;
};

const EMPTY: Loaded = { queries: [], books: [], showingRecent: true };
const DEBOUNCE_MS = 120;

export function useSearchSuggestions(text: string, enabled: boolean) {
  const db = useSQLiteContext();
  const [suggestions, setSuggestions] = useState<Loaded>(EMPTY);
  const [reloadKey, setReloadKey] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const request = ++latest.current;
    const timer = setTimeout(() => {
      getSearchSuggestions(db, text)
        .then((result) => {
          if (request === latest.current) {
            setSuggestions({ ...result, showingRecent: !text.trim() });
          }
        })
        .catch((error) => {
          console.warn("Couldn't load search suggestions:", error);
          if (request === latest.current) setSuggestions(EMPTY);
        });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [db, text, enabled, reloadKey]);

  const clearHistory = useCallback(async () => {
    await clearSearchHistory(db);
    setSuggestions(EMPTY);
    setReloadKey((k) => k + 1);
  }, [db]);

  return { ...(enabled ? suggestions : EMPTY), clearHistory };
}
