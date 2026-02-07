import { PlatformPressable, Text } from "@react-navigation/elements";
import { StyleSheet } from "react-native";
type TabBarBtnProps = {
  onPress: () => void;
  onLongPress: () => void;
  label: string;
};

export function TabBarBtn({ onPress, onLongPress, label }: TabBarBtnProps) {
  return (
    <PlatformPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={{ flex: 1 }}
    >
      <Text style={style.btnTxt}>{label}</Text>
    </PlatformPressable>
  );
}

const style = StyleSheet.create({
  btnTxt: {
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontSize: 16,
    color: "#ffffff",
  },
});
