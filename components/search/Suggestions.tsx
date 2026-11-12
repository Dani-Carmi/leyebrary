import { Book, BookStatus } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import StatusBadge from "@/components/StatusBadge";
import { mainBlack, mainWhite } from "@/utils/styles";

const PLACEHOLDER_COVER = require("@/assets/images/image-error.png");

type Props = {
  queries: string[];
  books: Book[];
  showingRecent: boolean;
  libraryStatusOf: (book: Book) => BookStatus | undefined;
  onSelectQuery: (query: string) => void;
  onSelectBook: (book: Book) => void;
  onClearHistory: () => void;
};

export default function SearchSuggestions({
  queries,
  books,
  showingRecent,
  libraryStatusOf,
  onSelectQuery,
  onSelectBook,
  onClearHistory,
}: Props) {
  return (
    <View style={styles.overlay}>
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {queries.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>
                {showingRecent ? "Recent searches" : "Searches"}
              </Text>
              {showingRecent && (
                <Pressable
                  onPress={onClearHistory}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search history"
                >
                  <Text style={styles.clearText}>Clear</Text>
                </Pressable>
              )}
            </View>
            {queries.map((query) => (
              <Pressable
                key={query}
                onPress={() => onSelectQuery(query)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${query}`}
              >
                <Ionicons name="time-outline" size={18} color="#888" />
                <Text style={styles.queryText} numberOfLines={1}>
                  {query}
                </Text>
                <Ionicons name="arrow-forward" size={16} color="#666" />
              </Pressable>
            ))}
          </View>
        )}

        {books.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, styles.sectionHeader]}>
              Books
            </Text>
            {books.map((book) => {
              const status = libraryStatusOf(book);
              const { title, authors, imageLinks } = book.volumeInfo;
              return (
                <Pressable
                  key={book.id}
                  onPress={() => onSelectBook(book)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${title}`}
                >
                  <Image
                    source={
                      imageLinks?.smallThumbnail ?? imageLinks?.thumbnail
                        ? {
                            uri:
                              imageLinks.smallThumbnail ?? imageLinks.thumbnail,
                          }
                        : PLACEHOLDER_COVER
                    }
                    style={styles.cover}
                    contentFit="cover"
                    cachePolicy="disk"
                  />
                  <View style={styles.bookInfo}>
                    <Text style={styles.bookTitle} numberOfLines={1}>
                      {title}
                    </Text>
                    {authors && (
                      <Text style={styles.bookAuthors} numberOfLines={1}>
                        {authors.join(", ")}
                      </Text>
                    )}
                  </View>
                  {status && <StatusBadge status={status} />}
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    backgroundColor: mainBlack,
  },
  panel: {
    flexGrow: 0,
    backgroundColor: "#0e1010",
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 12,
  },
  panelContent: {
    paddingVertical: 8,
  },
  section: {
    paddingVertical: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearText: {
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  pressed: {
    backgroundColor: "#1a1d21",
  },
  queryText: {
    flex: 1,
    color: mainWhite,
    fontSize: 15,
  },
  cover: {
    width: 28,
    height: 42,
    borderRadius: 3,
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    color: mainWhite,
    fontSize: 15,
    fontWeight: "600",
  },
  bookAuthors: {
    color: "#999",
    fontSize: 13,
    marginTop: 2,
  },
});
