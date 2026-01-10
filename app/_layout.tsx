import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";

function RootLayoutContent() {
  const db = useSQLiteContext();
  useDrizzleStudio(db);

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
              thumbnail TEXT NULL
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
