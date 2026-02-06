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
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  text: {
    color: "#fff",
  },
  button: {
    backgroundColor: "#1e90ff",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    color: "#fff",
  },
});
