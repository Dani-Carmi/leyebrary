import { BookStatus, DBBook } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { mainWhite } from "@/utils/styles";

const STATUS_OPTIONS: {
  status: BookStatus;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  color: string;
}[] = [
  {
    status: BookStatus.TO_READ,
    label: "To Read",
    icon: "time",
    color: "#007AFF",
  },
  {
    status: BookStatus.READING,
    label: "Reading",
    icon: "book",
    color: "#FF9500",
  },
  {
    status: BookStatus.READ,
    label: "Read",
    icon: "bookmark",
    color: "#34C759",
  },
];

interface BookActionSheetProps {
  book: DBBook;
  visible: boolean;
  onClose: () => void;
  onDelete: (bookId: string) => void;
  onStatusChange: (bookId: string, newStatus: BookStatus) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BookActionSheet({
  book,
  visible,
  onClose,
  onDelete,
  onStatusChange,
}: BookActionSheetProps) {
  const handleStatusPress = (newStatus: BookStatus) => {
    if (newStatus !== book.status) {
      onStatusChange(book.id, newStatus);
    }
  };

  const handleDelete = () => {
    onDelete(book.id);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <AnimatedPressable
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={styles.backdrop}
          onPress={onClose}
        />

        <Animated.View
          entering={SlideInDown.springify().duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={styles.sheet}
        >
          {/* Book title */}
          <Text style={styles.bookTitle} numberOfLines={2}>
            {book.title}
          </Text>
          {book.authors && (
            <Text style={styles.bookAuthors} numberOfLines={1}>
              {book.authors}
            </Text>
          )}

          <View style={styles.divider} />

          {/* Status buttons */}
          <Text style={styles.sectionLabel}>Status</Text>
          <View style={styles.statusRow}>
            {STATUS_OPTIONS.map((option) => {
              const isSelected = book.status === option.status;
              return (
                <Pressable
                  key={option.status}
                  style={[
                    styles.statusButton,
                    isSelected && {
                      backgroundColor: option.color,
                      borderColor: option.color,
                    },
                  ]}
                  onPress={() => handleStatusPress(option.status)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={isSelected ? mainWhite : option.color}
                  />
                  <Text
                    style={[
                      styles.statusButtonText,
                      isSelected
                        ? { color: mainWhite }
                        : { color: option.color },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.divider} />

          {/* Delete button */}
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={styles.deleteText}>Delete from Library</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  sheet: {
    backgroundColor: "#0e1010",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  bookTitle: {
    fontFamily: "Inter_700Bold",
    color: mainWhite,
    fontSize: 18,
    marginBottom: 2,
  },
  bookAuthors: {
    fontFamily: "Inter_400Regular",
    color: "#bbb",
    fontSize: 14,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 16,
  },
  sectionLabel: {
    fontFamily: "Inter_700Bold",
    color: "#999",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  statusButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 59, 48, 0.3)",
    backgroundColor: "rgba(255, 59, 48, 0.08)",
  },
  deleteText: {
    fontFamily: "Inter_700Bold",
    color: "#FF3B30",
    fontSize: 15,
  },
});
