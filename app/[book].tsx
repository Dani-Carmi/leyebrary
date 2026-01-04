import { Book } from "@/utils/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function BookDetailPage() {
  const { bookData } = useLocalSearchParams();
  const book: Book = JSON.parse(bookData as string);

  return (
    <>
      <Stack.Screen
        options={{
          title: book.volumeInfo.title,
          headerShown: true,
        }}
      />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Book ID: {book.id}</Text>
          <Text style={styles.subtitle}>{book.volumeInfo.title}</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#999",
    fontSize: 16,
    marginTop: 8,
  },
});
