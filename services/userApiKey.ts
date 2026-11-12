import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import Storage from "expo-sqlite/kv-store";

const STORAGE_KEY = "googleBooksUserApiKey";
const isWeb = Platform.OS === "web";

/** Google API keys are 39 URL-safe characters ("AIza…"); allow some slack. */
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{30,60}$/;

export const isPlausibleApiKey = (value: string) =>
  API_KEY_PATTERN.test(value);

export const loadUserApiKey = async (): Promise<string | null> => {
  const value = isWeb
    ? await Storage.getItem(STORAGE_KEY)
    : await SecureStore.getItemAsync(STORAGE_KEY);
  return value && isPlausibleApiKey(value) ? value : null;
};

export const saveUserApiKey = async (key: string) => {
  if (isWeb) await Storage.setItem(STORAGE_KEY, key);
  else await SecureStore.setItemAsync(STORAGE_KEY, key);
};

export const deleteUserApiKey = async () => {
  if (isWeb) await Storage.removeItem(STORAGE_KEY);
  else await SecureStore.deleteItemAsync(STORAGE_KEY);
};
