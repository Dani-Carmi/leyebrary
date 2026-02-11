import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { GoogleBooksApiResponse } from "../utils/types";

const BASE_URL = Constants.expoConfig?.extra?.googleBooksApiUrl;
const API_KEY = Constants.expoConfig?.extra?.googleBooksApiKey;

const fetchWithJsonp = (url: string): Promise<GoogleBooksApiResponse> => {
  return new Promise((resolve, reject) => {
    const callbackName = `jsonp_callback_${Date.now()}`;
    const script = document.createElement("script");

    // @ts-ignore
    window[callbackName] = (data: GoogleBooksApiResponse) => {
      // @ts-ignore
      delete window[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    script.src = `${url}&callback=${callbackName}`;
    script.onerror = () => {
      // @ts-ignore
      delete window[callbackName];
      document.body.removeChild(script);
      reject(new Error("JSONP request failed"));
    };

    document.body.appendChild(script);
  });
};

export const searchBooks = async (
  query: string,
): Promise<GoogleBooksApiResponse> => {
  try {
    // Use JSONP for web platform to avoid CORS issues
    if (Platform.OS === "web") {
      const url = `${BASE_URL}/volumes?q=${encodeURIComponent(query)}${
        API_KEY ? `&key=${API_KEY}` : ""
      }`;
      return await fetchWithJsonp(url);
    }

    const response = await axios.get<GoogleBooksApiResponse>(
      `${BASE_URL}/volumes`,
      {
        headers: {
          "x-api-key": API_KEY,
        },
        params: {
          q: query,
        },
      },
    );
    return response.data;
  } catch (error) {
    // eslint-disable-next-line
    if (axios.isAxiosError(error)) {
      throw new Error(
        `Google Books API Error: ${error.response?.status} - ${error.response?.statusText}`,
      );
    }
    throw new Error(`Unexpected Error: ${error}`);
  }
};
