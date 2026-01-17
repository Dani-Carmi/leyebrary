import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { DBBook } from "@/utils/types";
import {
  Text,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import LibraryBookListItem from "./library-book-list-item";

export default function LibraryBookList() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<DBBook[]>([]);

  const loadBooks = async () => {
    try {
      const res = await db.getAllSync("SELECT * FROM books");
      setBooks(res as DBBook[]);
    } catch (error) {
      console.error("Error loading books from database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>
          Your library is empty. Start adding some books!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={books}
      renderItem={({ item }) => <LibraryBookListItem item={item} />}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#bbb",
    fontSize: 16,
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
});
