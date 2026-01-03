import { Book } from "@/utils/types";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BookListItem({ item }: { item: Book }) {
  const { volumeInfo } = item;

  return (
    <TouchableOpacity style={styles.bookItem}>
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
      </View>
    </TouchableOpacity>
  );
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
});
