import { PlatformPressable} from "expo-router/react-navigation";
import { StyleSheet, Animated } from "react-native";
import { useEffect, useState } from "react";
import { mainWhite } from "@/utils/styles";

type TabBarBtnProps = {
  onPress: () => void;
  onLongPress: () => void;
  label: string;
  isFocused: boolean;
};

export function TabBarBtn({
  onPress,
  onLongPress,
  label,
  isFocused,
}: TabBarBtnProps) {
  const [animatedValue] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [animatedValue, isFocused]);

  const divFillColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", mainWhite],
  });

  const textColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [mainWhite, "#000000"],
  });

  return (
    <Animated.View style={style.divOuter}>
      <PlatformPressable
        onPress={onPress}
        onLongPress={onLongPress}
        style={[style.divInner, { backgroundColor: divFillColor }]}
      >
        <Animated.Text style={[style.btnTxt, { color: textColor }]}>
          {label}
        </Animated.Text>
      </PlatformPressable>
    </Animated.View>
  );
}

const style = StyleSheet.create({
  btnTxt: {
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontSize: 16,
  },
  divOuter: {
    borderColor: mainWhite,
    borderWidth: 1,
    width: 140,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
  },
  divInner: {
    backgroundColor: mainWhite,
    borderWidth: 1,
    width: 130,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
  },
});
