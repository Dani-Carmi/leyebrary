import Constants from "expo-constants";
import { Platform } from "react-native";
import { Book } from "@/utils/types";
import { isValidGoogleId, sanitizeVolume } from "@/utils/validation";

const config = Constants.expoConfig;
const extra = config?.extra ?? {};

const BASE_URL: string | undefined = extra.googleBooksApiUrl;

/**
 * Each platform has its own key, because Google allows only one kind of
 * application restriction per key.
 */
const API_KEY: string | undefined = Platform.select<string | undefined>({
  android: extra.googleBooksAndroidApiKey,
  ios: extra.googleBooksIosApiKey,
  default: extra.googleBooksWebApiKey,
});

/**
 * Google's own SDKs send these headers so "Android apps" / "iOS apps"
 * restricted keys can identify the caller; plain fetch has to add them.
 * (Browsers send a Referer instead, which "Websites" restrictions check.)
 */
const androidCertSha1 = String(extra.googleBooksAndroidCertSha1 ?? "")
  .replace(/:/g, "")
  .toUpperCase();

const omitEmpty = (headers: Record<string, string | undefined>) =>
  Object.fromEntries(
    Object.entries(headers).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );

const PLATFORM_HEADERS: Record<string, string> = omitEmpty(
  Platform.select<Record<string, string | undefined>>({
    android: {
      "X-Android-Package": config?.android?.package,
      "X-Android-Cert": androidCertSha1,
    },
    ios: { "X-Ios-Bundle-Identifier": config?.ios?.bundleIdentifier },
    default: {},
  }),
);

export const PAGE_SIZE = 20;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export class BooksApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "BooksApiError";
  }
}

export type SearchPage = { books: Book[]; totalItems: number };

/** Volumes seen in search results, so the detail screen needn't refetch. */
const volumeCache = new Map<string, Book>();
const MAX_CACHED_VOLUMES = 500;

const cacheVolume = (book: Book) => {
  if (volumeCache.size >= MAX_CACHED_VOLUMES) volumeCache.clear();
  volumeCache.set(book.id, book);
};

const buildUrl = (path: string, params: Record<string, string | number>) => {
  if (!BASE_URL?.startsWith("https://")) {
    throw new BooksApiError(
      "Google Books API URL is missing or not https. Check GOOGLE_BOOKS_API_URL.",
    );
  }
  const query = Object.entries({ ...params, ...(API_KEY ? { key: API_KEY } : {}) })
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return `${BASE_URL.replace(/\/+$/, "")}${path}?${query}`;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const isAbortError = (error: unknown) =>
  error instanceof Error && error.name === "AbortError";

/**
 * GETs JSON with a timeout, retrying transient failures (429/5xx, network
 * errors) with exponential backoff. `signal` lets callers cancel.
 */
const getJson = async (url: string, signal?: AbortSignal): Promise<unknown> => {
  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const onCallerAbort = () => controller.abort();
    signal?.addEventListener("abort", onCallerAbort);

    try {
      const response = await fetch(url, {
        headers: PLATFORM_HEADERS,
        signal: controller.signal,
      });
      if (response.ok) return await response.json();

      if (!RETRYABLE_STATUSES.has(response.status) || attempt >= MAX_RETRIES) {
        throw new BooksApiError(
          response.status === 429
            ? "Too many searches right now. Please try again in a minute."
            : response.status === 403
              ? "Google Books rejected the API key (403). Check the key and its restrictions."
              : `Google Books is unavailable (error ${response.status}). Please try again.`,
          response.status,
        );
      }
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error instanceof BooksApiError) throw error;
      if (attempt >= MAX_RETRIES) {
        throw new BooksApiError(
          isAbortError(error)
            ? "The search timed out. Check your connection and try again."
            : "Network error. Check your connection and try again.",
        );
      }
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener("abort", onCallerAbort);
    }

    await sleep(500 * 2 ** attempt);
  }
};

export const searchBooks = async (
  query: string,
  startIndex = 0,
  signal?: AbortSignal,
): Promise<SearchPage> => {
  const data = (await getJson(
    buildUrl("/volumes", { q: query, startIndex, maxResults: PAGE_SIZE }),
    signal,
  )) as { totalItems?: unknown; items?: unknown };

  const books = (Array.isArray(data?.items) ? data.items : [])
    .map(sanitizeVolume)
    .filter((b): b is Book => b !== null);
  books.forEach(cacheVolume);

  return {
    books,
    totalItems: typeof data?.totalItems === "number" ? data.totalItems : 0,
  };
};

/** Returns a volume by ID, from the search cache when possible. */
export const getBookById = async (
  id: string,
  signal?: AbortSignal,
): Promise<Book | null> => {
  if (!isValidGoogleId(id)) return null;
  const cached = volumeCache.get(id);
  if (cached) return cached;

  try {
    const book = sanitizeVolume(
      await getJson(buildUrl(`/volumes/${id}`, {}), signal),
    );
    if (book) cacheVolume(book);
    return book;
  } catch (error) {
    if (error instanceof BooksApiError && error.status === 404) return null;
    throw error;
  }
};
