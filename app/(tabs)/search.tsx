import { SearchBookList } from "@/components/search-book-list";
import { useBookSearch } from "@/hooks/useBookSearch";
import Background from "@/components/background";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function SearchScreen() {
  const { query, setQuery, books, loading, error, search, clearSearch } =
    useBookSearch();

  return (
    <SafeAreaProvider>
      <Background>
        <SafeAreaView>
          <SearchBookList
            query={query}
            setQuery={setQuery}
            books={books}
            loading={loading}
            error={error}
            search={search}
            clearSearch={clearSearch}
          />
        </SafeAreaView>
      </Background>
    </SafeAreaProvider>
  );
}
