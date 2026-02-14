import { BookStatus, DBBook } from "@/utils/types";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import BookActionSheet from "./book-action-sheet";
import { mainWhite } from "@/utils/styles";
import StatusBadge from "./statusBadge";
import { Image } from "expo-image";

interface LibraryBookListItemProps {
  item: DBBook;
  onDelete: (bookId: string) => void;
  onStatusChange: (bookId: string, newStatus: BookStatus) => void;
}

export default function LibraryBookListItem({
  item,
  onDelete,
  onStatusChange,
}: LibraryBookListItemProps) {
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <>
      <Pressable style={styles.bookItem} onPress={() => setSheetVisible(true)}>
        {item.thumbnail ? (
          <Image
            source={{
              uri: item.thumbnail
                ? item.thumbnail.replace("http://", "https://")
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
            {item.title}
          </Text>
          {item.authors && (
            <Text style={styles.authors} numberOfLines={1}>
              {item?.authors}
            </Text>
          )}
          {item.createdAt && (
            <Text style={styles.createdAt}>
              {new Date(item?.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>
        {item.status && (
          <View style={styles.statusContainer}>
            <StatusBadge status={item.status} />
          </View>
        )}
      </Pressable>

      <BookActionSheet
        book={item}
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
    </>
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
    borderColor: "#3a3f47",
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
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
    color: mainWhite,
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
  createdAt: {
    fontFamily: "Inter_400Regular_Italic",
    color: "#a7a7a7",
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
