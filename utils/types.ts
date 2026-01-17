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
