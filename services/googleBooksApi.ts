import axios from "axios";
import Constants from "expo-constants";
import { GoogleBooksApiResponse } from "../utils/types";

const BASE_URL = Constants.expoConfig?.extra?.googleBooksApiUrl;
const API_KEY = Constants.expoConfig?.extra?.googleBooksApiKey;

export const searchBooks = async (
  query: string
): Promise<GoogleBooksApiResponse> => {
  try {
    const response = await axios.get<GoogleBooksApiResponse>(
      `${BASE_URL}/volumes`,
      {
        headers: {
          "x-api-key": API_KEY,
        },
        params: {
          q: query,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Google Books API Error: ${error.response?.status} - ${error.response?.statusText}`
      );
    }
    throw new Error(`Unexpected Error: ${error}`);
  }
};
