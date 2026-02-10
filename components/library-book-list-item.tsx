import { DBBook } from "@/utils/types";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import StatusBadge from "./statusBadge";

export default function LibraryBookListItem({ item }: { item: DBBook }) {
  return (
    <Pressable style={styles.bookItem}>
      {item.thumbnail ? (
        <Image
          source={{ uri: item.thumbnail }}
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
          {item.title}
        </Text>
        {item.authors && (
          <Text style={styles.authors} numberOfLines={1}>
            {item.authors}
          </Text>
        )}
        {item.publishedDate && (
          <Text style={styles.year}>{item.publishedDate.substring(0, 4)}</Text>
        )}
      </View>
      {item.status && (
        <View style={styles.statusContainer}>
          <StatusBadge status={item.status} />
        </View>
      )}
    </Pressable>
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
    backgroundColor: "#11132ab4",
    borderColor: "#fff",
    borderWidth: 1,
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
    fontFamily: "Inter_700Bold",
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  authors: {
    fontFamily: "Inter_400Regular",
    color: "#bbb",
    fontSize: 16,
    marginBottom: 2,
  },
  year: {
    fontFamily: "Inter_400Regular_Italic",
    color: "#888",
    fontSize: 12,
  },
  statusContainer: {
    marginBottom: 4,
    marginLeft: 12,
    alignSelf: "flex-end",
  },
  status: {
    color: "#1e90ff",
    fontSize: 12,
    fontWeight: "500",
  },
});
