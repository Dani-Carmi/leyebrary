import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useFonts } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { InterFonts } from "@/utils/font";
import { useEffect } from "react";

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const db = useSQLiteContext();
  useDrizzleStudio(db);

  const [fontsLoaded, fontError] = useFonts({
    ...InterFonts(),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are loaded or if there's an error
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SQLiteProvider
      databaseName="booksdatabase.db"
      onInit={async (db) => {
        await db.execAsync(`
            CREATE TABLE IF NOT EXISTS books (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              subtitle TEXT NULL,
              authors TEXT NULL,
              publisher TEXT NULL,
              publishedDate DATE NULL,
              description TEXT NULL,
              pageCount INTEGER NULL,
              categories TEXT NULL,
              smallThumbnail TEXT NULL,
              thumbnail TEXT NULL,
              status TEXT CHECK(status IN ('TO_READ', 'READING', 'READ')) DEFAULT 'TO_READ' NOT NULL
            );
            PRAGMA journal_mode=WAL;
          `);
      }}
      options={{ useNewConnection: false }}
    >
      <RootLayoutContent />
    </SQLiteProvider>
  );
}
