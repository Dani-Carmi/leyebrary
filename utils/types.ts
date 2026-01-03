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
}

export interface GoogleBooksApiResponse {
  totalItems: number;
  items?: Book[];
}
