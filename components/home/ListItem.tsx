import { BookStatus, DBBook } from "@/utils/types";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import BookActionSheet from "./BookAction";
import { mainWhite } from "@/utils/styles";
import StatusBadge from "../StatusBadge";
import { Image } from "expo-image";

interface LibraryBookListItemProps {
  item: DBBook;
  onDelete: (bookId: number) => void;
  onStatusChange: (bookId: number, newStatus: BookStatus) => void;
}

export default function LibraryBookListItem({
  item,
  onDelete,
  onStatusChange,
}: LibraryBookListItemProps) {
  const router = useRouter();
  const [sheetVisible, setSheetVisible] = useState(false);

  const openEditor = () =>
    router.push({ pathname: "/library/[id]", params: { id: String(item.id) } });

  const openActions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSheetVisible(true);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.bookItem, pressed && styles.pressed]}
        onPress={openEditor}
        onLongPress={openActions}
        delayLongPress={350}
        accessibilityRole="button"
        accessibilityLabel={item.title}
        accessibilityHint="Opens reading details. Long press for quick actions."
        accessibilityActions={[{ name: "longpress", label: "Quick actions" }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === "longpress") openActions();
        }}
      >
        {item.thumbnail ? (
          <Image
            source={{ uri: item.thumbnail }}
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
          {item.tags && item.tags.length > 0 && (
            <Text style={styles.tags} numberOfLines={1}>
              {item.tags.map((t) => `#${t}`).join("  ")}
            </Text>
          )}
        </View>
        <View style={styles.side}>
          <Pressable
            onPress={() => setSheetVisible(true)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`Quick actions for ${item.title}`}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#999" />
          </Pressable>
          {item.status && <StatusBadge status={item.status} />}
        </View>
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
  side: {
    marginLeft: 12,
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  pressed: {
    opacity: 0.85,
  },
  tags: {
    color: "#8a8f98",
    fontSize: 12,
    marginTop: 4,
  },
  status: {
    color: "#1e90ff",
    fontSize: 12,
    fontWeight: "500",
  },
});
