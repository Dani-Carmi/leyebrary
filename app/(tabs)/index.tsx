import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Background from "@/components/background";
import LibraryBookList from "@/components/library-book-list";

export default function Index() {
  return (
    <SafeAreaProvider>
      <Background>
        <SafeAreaView style={styles.container}>
          <LibraryBookList />
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
