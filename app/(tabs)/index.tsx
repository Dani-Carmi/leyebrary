import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LibraryBookList from "@/components/library-book-list";

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Your books</Text>
      <LibraryBookList />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#25292e",
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
