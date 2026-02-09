import { Book } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { FC } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from "react-native";
import SearchBookListItem from "./search-book-list-item";

type Props = {
  query: string;
  setQuery: (query: string) => void;
  books: Book[];
  loading: boolean;
  error: string | null;
  search: () => void;
  clearSearch: () => void;
};

export const SearchBookList: FC<Props> = ({
  query,
  setQuery,
  books,
  loading,
  error,
  search,
  clearSearch,
}) => {
  const router = useRouter();
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={20}
    >
      <View style={styles.contentContainer}>
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
        {error && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        {!loading && !error && books.length === 0 && query.length > 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>No books found</Text>
          </View>
        )}
        {!loading && !error && books.length === 0 && query.length === 0 && (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>
              Start typing to search for books
            </Text>
          </View>
        )}
        {books.length > 0 && (
          <FlatList
            data={books}
            renderItem={({ item }) => (
              <SearchBookListItem
                item={item}
                onPress={() =>
                  router.push({
                    pathname: `/[book]`,
                    params: { book: item.id, bookData: JSON.stringify(item) },
                  })
                }
              />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
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
          onSubmitEditing={search}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        <Pressable
          onPress={search}
          style={styles.searchButton}
          disabled={loading || !query.trim()}
        >
          <Ionicons
            name="search"
            size={24}
            color={loading || !query.trim() ? "#666" : "#fff"}
          />
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
    backgroundColor: "#3a3f47",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  searchButton: {
    marginLeft: 8,
    padding: 8,
    backgroundColor: "#3a3f47",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    marginLeft: 8,
    padding: 8,
  },
  clearButtonText: {
    color: "#fff",
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
});
