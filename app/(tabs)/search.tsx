import { SearchBookList } from "@/components/search/List";
import { useBookSearch } from "@/hooks/useBookSearch";
import { useLibraryStatus } from "@/hooks/useLibraryStatus";
import Background from "@/components/Background";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";

export default function SearchScreen() {
  const searchState = useBookSearch();
  const libraryStatusOf = useLibraryStatus();

  return (
    <SafeAreaProvider>
      <Background>
        <SafeAreaView style={styles.container}>
          <SearchBookList {...searchState} libraryStatusOf={libraryStatusOf} />
        </SafeAreaView>
      </Background>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 16,
  },
});
