import { Book } from "@/utils/types";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

export default function LibraryBookListItem({ item }: { item: Book }) {
  const router = useRouter();
  const { volumeInfo } = item;

  const handlePress = () => {
    router.push(`/${item.id}`);
  };

  return (
    <TouchableOpacity style={styles.bookItem} onPress={handlePress}>
      {volumeInfo.imageLinks?.thumbnail ? (
        <Image
          source={{ uri: volumeInfo.imageLinks.thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnail, styles.noImage]}>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}

      <View style={styles.bookInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {volumeInfo.title}
        </Text>
        {volumeInfo.authors && (
          <Text style={styles.authors} numberOfLines={1}>
            {volumeInfo.authors.join(", ")}
          </Text>
        )}
        {volumeInfo.publishedDate && (
          <Text style={styles.year}>
            {volumeInfo.publishedDate.substring(0, 4)}
          </Text>
        )}
        {item.status && (
          <View style={styles.statusContainer}>
            <Text style={styles.status}>{formatStatus(item.status)}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function formatStatus(status: string): string {
  switch (status) {
    case "TO_READ":
      return "To Read";
    case "READING":
      return "Reading";
    case "READ":
      return "Read";
    default:
      return status;
  }
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 60,
    height: 90,
    borderRadius: 4,
  },
  bookItem: {
    flexDirection: "row",
    backgroundColor: "#3a3f47",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  noImageText: {
    color: "#666",
    fontSize: 10,
    textAlign: "center",
  },
  bookInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  noImage: {
    backgroundColor: "#2a2f37",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  authors: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 2,
  },
  year: {
    color: "#888",
    fontSize: 12,
  },
  statusContainer: {
    marginTop: 4,
  },
  status: {
    color: "#1e90ff",
    fontSize: 12,
    fontWeight: "500",
  },
});
