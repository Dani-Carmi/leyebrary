import { BookStatus } from "@/utils/types";
import { Text } from "react-native";
export default function StatusBadge({ status }: { status: BookStatus }) {
  switch (status) {
    case BookStatus.TO_READ:
      return <Badge text="To Read" textColor="#fff" bgColor="#aa731a" />;
    case BookStatus.READING:
      return <Badge text="Reading" textColor="#fff" bgColor="#2980b9" />;
    case BookStatus.READ:
      return <Badge text="Read" textColor="#fff" bgColor="#198445" />;
    default:
      return null;
  }
}

function Badge({
  text,
  textColor,
  bgColor,
}: {
  text: string;
  textColor: string;
  bgColor: string;
}) {
  return (
    <Text
      style={{
        fontFamily: "Inter_600SemiBold",
        backgroundColor: bgColor,
        color: textColor,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        fontSize: 12,
        fontWeight: "bold",
        alignSelf: "flex-start",
      }}
    >
      {text}
    </Text>
  );
}
