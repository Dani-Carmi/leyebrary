export enum BookStatus {
  TO_READ = "TO_READ",
  READING = "READING",
  READ = "READ",
}

export interface BookVolumeInfo {
  title: string;
  subtitle?: string;
  authors?: string[];
  publisher?: string;
  publishedDate?: string;
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    smallThumbnail?: string;
    thumbnail?: string;
  };
}

export interface Book {
  id: string;
  volumeInfo: BookVolumeInfo;
  status: BookStatus;
}

export interface GoogleBooksApiResponse {
  totalItems: number;
  items?: Book[];
}

export interface DBBook {
  id: number;
  googleId?: string | null; // Google Books volume ID, unique when present
  title: string;
  subtitle?: string | null;
  authors?: string | null; // Comma-separated string
  publisher?: string | null;
  publishedDate?: string | null;
  description?: string | null;
  pageCount?: number | null;
  categories?: string | null; // Comma-separated string
  smallThumbnail?: string | null;
  thumbnail?: string | null;
  status: BookStatus;
  createdAt: string;
  notes?: string | null;
  /** Tag names, joined from `book_tags`; not a column of `books`. */
  tags?: string[];
}

/** Fields needed to insert a book; `id` is assigned by SQLite. */
export type NewBook = Omit<DBBook, "id" | "tags">;

/** One read-through of a book. Dates are local calendar days, YYYY-MM-DD. */
export interface ReadingSession {
  id: number;
  bookId: number;
  startedAt: string | null;
  finishedAt: string | null;
}

export type ReadingDates = Pick<ReadingSession, "startedAt" | "finishedAt">;

/** A book as stored in a backup file, with its reading data. */
export type PortableBook = NewBook & {
  readings: ReadingDates[];
  tags: string[];
};
