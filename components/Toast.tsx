import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ComponentProps,
} from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { mainWhite } from "@/utils/styles";

type ToastType = "success" | "error" | "info";

type ToastMessage = {
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useSharedValue(-100);

  // Pending hide timers. A new toast cancels them so it gets its full
  // 3 seconds instead of being hidden by the previous toast's timer.
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => clearTimers, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      clearTimers();
      setToast({ message, type });
      // .set() rather than assigning .value keeps the React Compiler happy.
      translateY.set(-100);
      translateY.set(withSpring(0, { damping: 15, stiffness: 100 }));

      // Auto-hide after 3 seconds
      timers.current.push(
        setTimeout(() => {
          translateY.set(withSpring(-100, { damping: 15, stiffness: 100 }));
          timers.current.push(setTimeout(() => setToast(null), 300));
        }, 3000),
      );
    },
    [translateY],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle" as ComponentProps<typeof Ionicons>["name"],
          color: "#34C759",
        };
      case "error":
        return {
          icon: "close-circle" as ComponentProps<typeof Ionicons>["name"],
          color: "#FF3B30",
        };
      case "info":
        return {
          icon: "information-circle" as ComponentProps<typeof Ionicons>["name"],
          color: "#007AFF",
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View style={[styles.toastContainer, animatedStyle]}>
          <View
            style={[
              styles.toast,
              { borderLeftColor: getToastConfig(toast.type).color },
            ]}
          >
            <Ionicons
              name={getToastConfig(toast.type).icon}
              size={24}
              color={getToastConfig(toast.type).color}
            />
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: "#0e1010",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderLeftWidth: 4,
    shadowColor: "#181818",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: mainWhite,
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
});
