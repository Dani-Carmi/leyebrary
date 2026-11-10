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
import {
  addBook,
  findInLibrary,
  isDuplicateBookError,
  libraryMatchFor,
} from "@/services/booksRepository";
import * as Haptics from "expo-haptics";

type LoadState =
  | { kind: "loading" }
  // `owned` is the book's status when it's already in the library.
  | { kind: "ready"; book: Book; owned: BookStatus | null }
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
      .then(async (book) => {
        if (controller.signal.aborted) return;
        if (!book) {
          setState({ kind: "error", message: "This book couldn't be found." });
          return;
        }
        const saved = await findInLibrary(db, libraryMatchFor(book));
        if (controller.signal.aborted) return;
        setState({ kind: "ready", book, owned: saved?.status ?? null });
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
  }, [bookId, db]);

  const markOwned = (status: BookStatus) =>
    setState((s) => (s.kind === "ready" ? { ...s, owned: status } : s));

  const handleAddBook = async (book: Book, status: BookStatus) => {
    if (isAdding) return;
    setIsAdding(true);
    const match = libraryMatchFor(book);
    try {
      // The add buttons are hidden for owned books; this guards the gap
      // between loading the screen and tapping (e.g. added elsewhere).
      const existing = await findInLibrary(db, match);
      if (existing) {
        markOwned(existing.status);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast("This book is already in your library", "info");
        return;
      }
      const info = book.volumeInfo;
      await addBook(db, {
        googleId: match.googleId,
        title: match.title,
        subtitle: info.subtitle ?? null,
        authors: match.authors,
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
      markOwned(status);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Book added to your library", "success");
    } catch (error) {
      if (isDuplicateBookError(error)) {
        // Lost a race with another insert: the unique index kept it single.
        const saved = await findInLibrary(db, match).catch(() => null);
        if (saved) markOwned(saved.status);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        showToast("This book is already in your library", "info");
        return;
      }
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
            libraryStatus={state.owned}
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
