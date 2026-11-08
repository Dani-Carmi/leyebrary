import { Book, BookStatus, NewBook } from "./types";

/** Google Books volume IDs are short URL-safe strings (e.g. "zyTCAlFPjgYC"). */
const GOOGLE_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/** Hosts Google Books serves cover images from. Anything else is dropped. */
const ALLOWED_IMAGE_HOSTS = ["books.google.com", "books.googleusercontent.com"];
const ALLOWED_IMAGE_HOST_SUFFIXES = [".googleusercontent.com"];

// Parsed by hand: React Native's URL polyfill doesn't implement `hostname`.
const URL_PATTERN = /^(https?):\/\/([^/?#:@]+)(:\d+)?([/?#].*)?$/i;

const VALID_STATUSES = new Set<string>(Object.values(BookStatus));

const MAX_TITLE_LENGTH = 500;
const MAX_FIELD_LENGTH = 2_000;
const MAX_DESCRIPTION_LENGTH = 20_000;

export const isValidGoogleId = (value: unknown): value is string =>
  typeof value === "string" && GOOGLE_ID_PATTERN.test(value);

/**
 * Returns an https URL when `url` points at a Google Books image host,
 * otherwise null. Google returns http:// links, which iOS ATS blocks.
 */
export const sanitizeImageUrl = (url: unknown): string | null => {
  if (typeof url !== "string" || url.length > MAX_FIELD_LENGTH) return null;
  const match = URL_PATTERN.exec(url.trim());
  if (!match) return null;
  const host = match[2].toLowerCase();
  const allowed =
    ALLOWED_IMAGE_HOSTS.includes(host) ||
    ALLOWED_IMAGE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
  if (!allowed || match[3]) return null;
  return `https://${host}${match[4] ?? ""}`;
};

const optionalString = (value: unknown, maxLength = MAX_FIELD_LENGTH) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
};

const optionalPageCount = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;

/** Normalises any parseable date to ISO 8601 UTC; falls back to now. */
export const toIsoTimestamp = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    // SQLite's CURRENT_TIMESTAMP format ("YYYY-MM-DD HH:MM:SS") is UTC.
    const normalised =
      typeof value === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
        ? `${value.replace(" ", "T")}Z`
        : value;
    const date = new Date(normalised);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return new Date().toISOString();
};

/**
 * Validates one entry from an imported backup file. Returns null when the
 * entry is unusable; otherwise a copy holding only known, well-typed fields.
 */
export const sanitizeImportedBook = (value: unknown): NewBook | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const b = value as Record<string, unknown>;

  const title = optionalString(b.title, MAX_TITLE_LENGTH);
  if (!title) return null;
  if (typeof b.status !== "string" || !VALID_STATUSES.has(b.status)) {
    return null;
  }

  return {
    googleId: isValidGoogleId(b.googleId) ? b.googleId : null,
    title,
    subtitle: optionalString(b.subtitle),
    authors: optionalString(b.authors),
    publisher: optionalString(b.publisher),
    publishedDate: optionalString(b.publishedDate, 32),
    description: optionalString(b.description, MAX_DESCRIPTION_LENGTH),
    pageCount: optionalPageCount(b.pageCount),
    categories: optionalString(b.categories),
    smallThumbnail: sanitizeImageUrl(b.smallThumbnail),
    thumbnail: sanitizeImageUrl(b.thumbnail),
    status: b.status as BookStatus,
    createdAt: toIsoTimestamp(b.createdAt),
  };
};

const stringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const items = value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.slice(0, MAX_FIELD_LENGTH));
  return items.length > 0 ? items : undefined;
};

/**
 * Validates a Google Books volume (from the API) into the app's `Book` shape,
 * keeping only known fields and safe image URLs. Returns null if unusable.
 */
export const sanitizeVolume = (value: unknown): Book | null => {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  if (!isValidGoogleId(v.id)) return null;
  const info = v.volumeInfo as Record<string, unknown> | undefined;
  if (!info || typeof info !== "object") return null;

  const title = optionalString(info.title, MAX_TITLE_LENGTH);
  if (!title) return null;

  const links = info.imageLinks as Record<string, unknown> | undefined;
  const smallThumbnail = sanitizeImageUrl(links?.smallThumbnail) ?? undefined;
  const thumbnail = sanitizeImageUrl(links?.thumbnail) ?? undefined;

  return {
    id: v.id,
    status: BookStatus.TO_READ,
    volumeInfo: {
      title,
      subtitle: optionalString(info.subtitle) ?? undefined,
      authors: stringArray(info.authors),
      publisher: optionalString(info.publisher) ?? undefined,
      publishedDate: optionalString(info.publishedDate, 32) ?? undefined,
      description:
        optionalString(info.description, MAX_DESCRIPTION_LENGTH) ?? undefined,
      pageCount: optionalPageCount(info.pageCount) ?? undefined,
      categories: stringArray(info.categories),
      imageLinks:
        smallThumbnail || thumbnail ? { smallThumbnail, thumbnail } : undefined,
    },
  };
};
