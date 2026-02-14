import { BookStatus } from "@/utils/types";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import {
  mainWhite,
  toReadStatusBgColor,
  toReadStatusBorderColor,
  readingStatusBgColor,
  readingStatusBorderColor,
  readStatusBgColor,
  readStatusBorderColor,
} from "@/utils/styles";

export default function StatusBadge({ status }: { status: BookStatus }) {
  switch (status) {
    case BookStatus.TO_READ:
      return (
        <Badge
          icon="time-outline"
          textColor={mainWhite}
          bgColor={toReadStatusBgColor}
          borderColor={toReadStatusBorderColor}
        />
      );
    case BookStatus.READING:
      return (
        <Badge
          icon="book-outline"
          textColor={mainWhite}
          bgColor={readingStatusBgColor}
          borderColor={readingStatusBorderColor}
        />
      );
    case BookStatus.READ:
      return (
        <Badge
          icon="bookmark-outline"
          textColor={mainWhite}
          bgColor={readStatusBgColor}
          borderColor={readStatusBorderColor}
        />
      );
    default:
      return null;
  }
}

function Badge({
  icon,
  textColor,
  bgColor,
  borderColor,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  textColor: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <View
      style={[
        style.badgeContainer,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 1,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 4,
        },
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
  },
});
