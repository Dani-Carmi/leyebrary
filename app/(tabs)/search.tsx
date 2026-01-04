import { BookList } from "@/components/book-list";
import { useBookSearch } from "@/hooks/useBookSearch";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const { query, setQuery, books, loading, error, search, clearSearch } =
    useBookSearch();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <BookList
          query={query}
          setQuery={setQuery}
          books={books}
          loading={loading}
          error={error}
          search={search}
          clearSearch={clearSearch}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
});
