import { Book, BookStatus } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FC, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import SearchBookListItem from "./ListItem";
import SearchSuggestions from "./Suggestions";
import { useSearchSuggestions } from "@/hooks/useSearchSuggestions";
import { mainBlack, mainWhite } from "@/utils/styles";

type Props = {
  query: string;
  searchedQuery: string | null;
  setQuery: (query: string) => void;
  books: Book[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  search: (text?: string) => void;
  loadMore: () => void;
  clearSearch: () => void;
  libraryStatusOf: (book: Book) => BookStatus | undefined;
};

export const SearchBookList: FC<Props> = ({
  query,
  searchedQuery,
  setQuery,
  books,
  loading,
  loadingMore,
  error,
  search,
  loadMore,
  clearSearch,
  libraryStatusOf,
}) => {
  const router = useRouter();
  const [inputFocused, setInputFocused] = useState(false);
  const suggestions = useSearchSuggestions(query, inputFocused);
  const showSuggestions =
    suggestions.queries.length > 0 || suggestions.books.length > 0;

  const openBook = (book: Book) =>
    router.push({ pathname: "/[book]", params: { book: book.id } });

  const confirmClearHistory = () =>
    Alert.alert(
      "Clear search history?",
      "This removes your recent searches and saved results from this device. Your library isn't affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () =>
            suggestions.clearHistory().catch((error) => {
              console.error("Couldn't clear search history:", error);
              Alert.alert("Couldn't clear search history");
            }),
        },
      ],
    );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={20}
    >
      <View style={styles.contentContainer}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color={mainWhite} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
        {error && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {!loading && !error && books.length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              {searchedQuery
                ? `No books found for “${searchedQuery}”`
                : query.trim()
                  ? "Tap search to find books"
                  : "Start typing to search for books"}
            </Text>
          </View>
        )}
        {!loading && books.length > 0 && (
          <FlatList
            data={books}
            renderItem={({ item }) => (
              <SearchBookListItem
                item={item}
                libraryStatus={libraryStatusOf(item)}
                onPress={() => openBook(item)}
              />
            )}
            keyExtractor={(item) => item.id}
            extraData={libraryStatusOf}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator style={styles.footer} color={mainWhite} />
              ) : undefined
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
        {showSuggestions && (
          <SearchSuggestions
            queries={suggestions.queries}
            books={suggestions.books}
            showingRecent={suggestions.showingRecent}
            libraryStatusOf={libraryStatusOf}
            onSelectQuery={(text) => {
              Keyboard.dismiss();
              search(text);
            }}
            onSelectBook={(book) => {
              Keyboard.dismiss();
              openBook(book);
            }}
            onClearHistory={confirmClearHistory}
          />
        )}
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for books..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => search()}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <Pressable
          onPress={() => search()}
          style={({ pressed }) => [
            styles.searchButton,
            pressed && styles.searchButtonPressed,
          ]}
          disabled={loading || !query.trim()}
        >
          {({ pressed }) => (
            <Ionicons
              name="search"
              size={24}
              color={
                loading || !query.trim()
                  ? "#e8e8e8"
                  : pressed
                    ? mainBlack
                    : mainWhite
              }
            />
          )}
        </Pressable>
        {query.length > 0 && (
          <Pressable onPress={clearSearch} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>×</Text>
          </Pressable>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 100,
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    borderColor: mainWhite,
    borderWidth: 1,
    color: mainWhite,
    padding: 12,
    fontSize: 16,
    borderRadius: 100,
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
    borderColor: mainWhite,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 100,
  },
  searchButtonPressed: {
    backgroundColor: mainWhite,
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 100,
  },
  clearButtonText: {
    color: mainWhite,
    fontSize: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#999",
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
  },
  footer: {
    paddingVertical: 16,
  },
});
