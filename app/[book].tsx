import SearchBookItemDetails from "@/components/searchBookItemDetails";
import { Book, BookStatus } from "@/utils/types";
import { useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/components/toast";

export default function BookDetailPage() {
  const { bookData } = useLocalSearchParams();
  const book: Book = JSON.parse(bookData as string);

  const db = useSQLiteContext();
  const { showToast } = useToast();

  const addBookToDatabase = async (status: BookStatus) => {
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
        status,
      ],
    );
    return result;
  };

  const handleAddBook = async (status: BookStatus) => {
    try {
      await addBookToDatabase(status);
      showToast("Book added successfully!", "success");
    } catch (error) {
      console.error("Error adding book to database:", error);
      showToast(
        `Failed to add book: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error",
      );
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <SearchBookItemDetails
          book={book}
          onAddBook={(status) => handleAddBook(status)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#11132a",
  },
});
