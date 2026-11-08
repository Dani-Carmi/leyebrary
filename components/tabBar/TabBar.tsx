import { View, StyleSheet } from "react-native";
import { BottomTabBarProps } from "expo-router/js-tabs";
import { TabBarBtn } from "./TabBarBtn";

export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const labelText = typeof label === "string" ? label : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = emitter.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigateToTab(route.key);
          }
        };

        const onLongPress = () => {
          emitter.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TabBarBtn
            key={route.key}
            onLongPress={onLongPress}
            onPress={onPress}
            label={labelText}
            isFocused={isFocused}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    justifyContent: "center",
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    gap: 20,
  },
});
