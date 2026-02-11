import { TouchableOpacity } from "react-native";
import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

type CustomButtonProps = {
  onPress: () => void;
  icon: ComponentProps<typeof Ionicons>["name"];
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export default function CustomButton({
  onPress,
  icon,
  disabled = false,
}: CustomButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7}>
      <Ionicons name={icon} size={25} color="#fffff9df" />
    </TouchableOpacity>
  );
}
