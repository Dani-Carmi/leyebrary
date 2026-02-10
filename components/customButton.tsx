import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type CustomButtonProps = {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export default function CustomButton({
  onPress,
  title,
  disabled = false,
}: CustomButtonProps) {
  return (
    <View style={styles.divOuter}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={styles.divInner}
        activeOpacity={0.7}
      >
        <Text style={styles.btnTxt}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btnTxt: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    fontSize: 16,
    color: "#000000",
  },
  divOuter: {
    borderColor: "#ffffff",
    borderWidth: 1,
    width: 140,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  divInner: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    width: 130,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
