import Constants from "expo-constants";
import { Platform } from "react-native";
import { Book } from "@/utils/types";
import { isValidGoogleId, sanitizeVolume } from "@/utils/validation";
import { loadUserApiKey } from "@/services/userApiKey";

const config = Constants.expoConfig;
const extra = config?.extra ?? {};

const BASE_URL: string | undefined = extra.googleBooksApiUrl;

/**
 * Each platform has its own key, because Google allows only one kind of
 * application restriction per key. Public builds ship without one.
 */
const BUILT_IN_API_KEY: string | undefined =
  Platform.select<string | undefined>({
    android: extra.googleBooksAndroidApiKey,
    ios: extra.googleBooksIosApiKey,
    default: extra.googleBooksWebApiKey,
  }) || undefined;

export const hasBuiltInApiKey = Boolean(BUILT_IN_API_KEY);

/**
 * A key the user pasted in Settings wins over the built-in one.
 * `undefined` means "not read from storage yet".
 */
let userApiKey: string | null | undefined;

export const setUserApiKey = (key: string | null) => {
  userApiKey = key;
};

const resolveApiKey = async (): Promise<string | undefined> => {
  if (userApiKey === undefined) {
    userApiKey = await loadUserApiKey().catch((error) => {
      console.warn("Couldn't read the saved API key:", error);
      return null;
    });
  }
  return userApiKey ?? BUILT_IN_API_KEY;
};

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
    /** True when adding or fixing an API key in Settings would help. */
    readonly needsApiKey = false,
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

const buildUrl = (
  path: string,
  params: Record<string, string | number>,
  apiKey: string | undefined,
) => {
  if (!BASE_URL?.startsWith("https://")) {
    throw new BooksApiError(
      "Google Books API URL is missing or not https. Check GOOGLE_BOOKS_API_URL.",
    );
  }
  const query = Object.entries({ ...params, ...(apiKey ? { key: apiKey } : {}) })
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
const NO_KEY_HINT =
  "Google's shared quota is used up. Add your own API key in Settings.";

/** Turns a failed response into a message the user can act on. */
const statusMessage = (status: number, usedKey: boolean) => {
  if (!usedKey && (status === 429 || status === 403)) return NO_KEY_HINT;
  if (status === 429) {
    return "Too many searches right now. Please try again in a minute.";
  }
  if (status === 400 || status === 403) {
    return "Google Books rejected the API key. Check it in Settings.";
  }
  return `Google Books is unavailable (error ${status}). Please try again.`;
};

const getJson = async (
  url: string,
  signal: AbortSignal | undefined,
  usedKey: boolean,
): Promise<unknown> => {
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
        const { status } = response;
        throw new BooksApiError(
          statusMessage(status, usedKey),
          status,
          usedKey ? status === 400 || status === 403 : status === 429 || status === 403,
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
  const apiKey = await resolveApiKey();
  const data = (await getJson(
    buildUrl("/volumes", { q: query, startIndex, maxResults: PAGE_SIZE }, apiKey),
    signal,
    Boolean(apiKey),
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
    const apiKey = await resolveApiKey();
    const book = sanitizeVolume(
      await getJson(buildUrl(`/volumes/${id}`, {}, apiKey), signal, Boolean(apiKey)),
    );
    if (book) cacheVolume(book);
    return book;
  } catch (error) {
    if (error instanceof BooksApiError && error.status === 404) return null;
    throw error;
  }
};

/**
 * Checks a key with one tiny request before it is saved. Resolves to null
 * when Google accepts it, or to a message saying why it didn't.
 */
export const verifyApiKey = async (key: string): Promise<string | null> => {
  try {
    await getJson(
      buildUrl("/volumes", { q: "leyebrary", maxResults: 1, fields: "totalItems" }, key),
      undefined,
      true,
    );
    return null;
  } catch (error) {
    if (
      error instanceof BooksApiError &&
      (error.status === 400 || error.status === 403)
    ) {
      return "Google rejected this key. Check that you copied all of it and that the Books API is enabled in its project.";
    }
    return error instanceof Error ? error.message : "Couldn't check the key.";
  }
};
