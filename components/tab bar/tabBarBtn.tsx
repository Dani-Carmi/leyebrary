import { PlatformPressable } from "@react-navigation/elements";
import { StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";

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
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isFocused ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const divFillColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", "#ffffff"],
  });

  const textColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#ffffff", "#000000"],
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
