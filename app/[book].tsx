import SearchBookItemDetails from "@/components/search/ItemDetails";
import { Book, BookStatus } from "@/utils/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "@/components/Toast";
import { mainBlack, mainWhite } from "@/utils/styles";
import { getBookById } from "@/services/googleBooksApi";
import { addBook, findByGoogleId } from "@/services/booksRepository";
import * as Haptics from "expo-haptics";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; book: Book }
  | { kind: "error"; message: string };

export default function BookDetailPage() {
  // Only the volume ID travels in the route; the book itself is looked up,
  // so a crafted link can't inject book data or crash the screen.
  const { book: bookParam } = useLocalSearchParams<{ book: string }>();
  const bookId = typeof bookParam === "string" ? bookParam : "";

  const router = useRouter();
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getBookById(bookId, controller.signal)
      .then((book) => {
        if (controller.signal.aborted) return;
        setState(
          book
            ? { kind: "ready", book }
            : { kind: "error", message: "This book couldn't be found." },
        );
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "error",
          message:
            error instanceof Error ? error.message : "Couldn't load this book.",
        });
      });
    return () => controller.abort();
  }, [bookId]);

  const handleAddBook = async (book: Book, status: BookStatus) => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const existing = await findByGoogleId(db, book.id);
      if (existing) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast("This book is already in your library", "info");
        return;
      }
      const info = book.volumeInfo;
      await addBook(db, {
        googleId: book.id,
        title: info.title,
        subtitle: info.subtitle ?? null,
        authors: info.authors?.join(", ") ?? null,
        publisher: info.publisher ?? null,
        publishedDate: info.publishedDate ?? null,
        description: info.description ?? null,
        pageCount: info.pageCount ?? null,
        categories: info.categories?.join(", ") ?? null,
        smallThumbnail: info.imageLinks?.smallThumbnail ?? null,
        thumbnail: info.imageLinks?.thumbnail ?? null,
        status,
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Book added to your library", "success");
    } catch (error) {
      console.error("Error adding book to database:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast("Couldn't add the book. Please try again.", "error");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {state.kind === "ready" ? (
          <SearchBookItemDetails
            book={state.book}
            onAddBook={(status) => handleAddBook(state.book, status)}
          />
        ) : (
          <View style={styles.center}>
            {state.kind === "loading" ? (
              <ActivityIndicator size="large" color={mainWhite} />
            ) : (
              <>
                <Text style={styles.message}>{state.message}</Text>
                <Pressable
                  onPress={() =>
                    router.canGoBack() ? router.back() : router.replace("/")
                  }
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Go back</Text>
                </Pressable>
              </>
            )}
          </View>
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mainBlack,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  message: {
    color: mainWhite,
    fontSize: 16,
    textAlign: "center",
  },
  backButton: {
    borderColor: mainWhite,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: mainWhite,
    fontSize: 15,
  },
});
