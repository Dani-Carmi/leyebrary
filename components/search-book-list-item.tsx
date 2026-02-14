import { Book } from "@/utils/types";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { mainWhite } from "@/utils/styles";
import { Image } from "expo-image";

export default function SearchBookListItem({
  item,
  onPress,
}: {
  item: Book;
  onPress: () => void;
}) {
  const { volumeInfo } = item;

  return (
    <TouchableOpacity style={styles.bookItem} onPress={onPress}>
      {volumeInfo.imageLinks?.thumbnail ? (
        <Image
          source={{
            uri: volumeInfo.imageLinks.thumbnail
              ? volumeInfo.imageLinks.thumbnail.replace("http://", "https://")
              : "./assets/image-error.png",
          }} // Ensure https
          style={styles.thumbnail}
          contentFit="cover"
          cachePolicy="disk"
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
    backgroundColor: "#0e1010",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderColor: "#3a3f47",
    borderWidth: 1,
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
    color: mainWhite,
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
