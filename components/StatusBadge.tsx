import { BookStatus } from "@/utils/types";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { mainWhite } from "@/utils/styles";
import { STATUS_META } from "@/utils/bookStatus";

type StatusBadgeProps = {
  status: BookStatus;
  /** Show the status name next to the icon (e.g. "Reading"). */
  showLabel?: boolean;
};

export default function StatusBadge({ status, showLabel }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  if (!meta) return null;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: meta.bgColor, borderColor: meta.borderColor },
      ]}
      accessible
      accessibilityLabel={`Status: ${meta.label}`}
    >
      <Ionicons name={meta.icon} size={16} color={mainWhite} />
      {showLabel && <Text style={styles.label}>{meta.label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    color: mainWhite,
    fontSize: 13,
  },
});
