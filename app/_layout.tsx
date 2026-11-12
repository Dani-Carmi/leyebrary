import { useDrizzleStudio } from "expo-drizzle-studio-plugin";
import { Stack } from "expo-router";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import { useFonts } from "@expo-google-fonts/inter";
import * as SplashScreen from "expo-splash-screen";
import { InterFonts } from "@/utils/styles";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ToastProvider } from "@/components/Toast";
import Background from "@/components/Background";
import { DATABASE_NAME, migrateDatabase } from "@/services/booksRepository";

// Keep the splash screen visible while fonts load
SplashScreen.preventAutoHideAsync();

/** Exposes the database to the Drizzle Studio dev tool; rendered in dev only. */
function DrizzleStudio() {
  const db = useSQLiteContext();
  useDrizzleStudio(db);
  return null;
}

function RootLayoutContent() {
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
    <ToastProvider>
      {__DEV__ && <DrizzleStudio />}
      <Background>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="library/[id]"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
          <Stack.Screen
            name="[book]"
            options={{
              headerShown: false,
              animation: "fade",
              animationDuration: 300,
            }}
          />
        </Stack>
      </Background>
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        onInit={migrateDatabase}
        options={{ useNewConnection: false }}
      >
        <RootLayoutContent />
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
