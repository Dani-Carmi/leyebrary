import SearchBookItemDetails from "@/components/searchBookItemDetails";
import { Book } from "@/utils/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function BookDetailPage() {
  const { bookData } = useLocalSearchParams();
  const book: Book = JSON.parse(bookData as string);

  const db = useSQLiteContext();

  const addBookToDatabase = async () => {
    const {
      title,
      subtitle,
      authors,
      publisher,
      publishedDate,
      description,
      pageCount,
      categories,
      imageLinks,
    } = book.volumeInfo;

    const result = await db.runAsync(
      `INSERT INTO books (title, subtitle, authors, publisher, publishedDate, description, pageCount, categories, smallThumbnail, thumbnail, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        subtitle || null,
        authors ? authors.join(", ") : null,
        publisher || null,
        publishedDate || null,
        description || null,
        pageCount || null,
        categories ? categories.join(", ") : null,
        imageLinks?.smallThumbnail || null,
        imageLinks?.thumbnail || null,
        "TO_READ",
      ],
    );
    return result;
  };

  const handleAddBook = async () => {
    try {
      await addBookToDatabase();
      alert(`Book added successfully!`);
    } catch (error) {
      console.error("Error adding book to database:", error);
      alert(
        `Failed to add book: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: book.volumeInfo.title,
          headerShown: false,
        }}
      />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <SearchBookItemDetails book={book} onAddBook={handleAddBook} />
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#11132a",
  },
});
