import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, Rect, RadialGradient, Stop } from "react-native-svg";
import { mainBlack } from "@/utils/styles";

const FROM_COLOR = mainBlack;
const TO_COLOR = mainBlack;

const Background = ({ children }: { children: React.ReactNode }) => {
  return (
    <View style={{ flex: 1 }}>
      <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
        <Defs>
          <RadialGradient id="grad" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={FROM_COLOR} />
            <Stop offset="1" stopColor={TO_COLOR} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#grad)" />
      </Svg>
      {children}
    </View>
  );
};

export default Background;
