import { BookStatus } from "@/utils/types";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";

export default function StatusBadge({ status }: { status: BookStatus }) {
  switch (status) {
    case BookStatus.TO_READ:
      return <Badge icon="time" textColor="#fff" bgColor="#007AFF" />;
    case BookStatus.READING:
      return <Badge icon="book" textColor="#fff" bgColor="#FF9500" />;
    case BookStatus.READ:
      return <Badge icon="bookmark" textColor="#fff" bgColor="#34C759" />;
    default:
      return null;
  }
}

function Badge({
  icon,
  textColor,
  bgColor,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  textColor: string;
  bgColor: string;
}) {
  return (
    <View
      style={[
        style.badgeContainer,
        { backgroundColor: bgColor, paddingVertical: 4, paddingHorizontal: 8 },
      ]}
    >
      <Ionicons name={icon} size={16} color={textColor} />
    </View>
  );
}

const style = StyleSheet.create({
  badgeContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 4,
  },
});
