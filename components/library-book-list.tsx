import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { BookStatus, DBBook } from "@/utils/types";
import { Text, ActivityIndicator, FlatList, View } from "react-native";
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

  const handleDelete = (bookId: string) => {
    try {
      db.runSync("DELETE FROM books WHERE id = ?", [bookId]);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  const handleStatusChange = (bookId: string, newStatus: BookStatus) => {
    try {
      db.runSync("UPDATE books SET status = ? WHERE id = ?", [
        newStatus,
        bookId,
      ]);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, status: newStatus } : b)),
      );
    } catch (error) {
      console.error("Error updating book status:", error);
    }
  };

  useEffect(() => {
    loadBooks();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          Your library is empty. Start adding some books!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={books}
      renderItem={({ item }) => (
        <LibraryBookListItem
          item={item}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      )}
      keyExtractor={(item) => item.id}
      style={{ marginBottom: 100 }}
    />
  );
}
