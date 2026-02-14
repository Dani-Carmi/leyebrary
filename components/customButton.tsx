import { TouchableOpacity } from "react-native";
import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { mainWhite } from "@/utils/styles";

type CustomButtonProps = {
  onPress: () => void;
  icon: ComponentProps<typeof Ionicons>["name"];
  variant?: "primary" | "secondary";
  disabled?: boolean;
  bgColor: string;
  borderColor: string;
};

export default function CustomButton({
  onPress,
  icon,
  disabled = false,
  bgColor,
  borderColor,
}: CustomButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        backgroundColor: bgColor,
        padding: 10,
        paddingHorizontal: 30,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: borderColor,
      }}
    >
      <Ionicons name={icon} size={20} color={mainWhite} />
    </TouchableOpacity>
  );
}
