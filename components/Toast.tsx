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
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const VISIBLE_MS = 3000;
/** How far above its resting place the toast starts / ends (it also fades). */
const SLIDE_DISTANCE = 40;
/** Upward drag (px) or fling speed (px/s) that dismisses the toast. */
const DISMISS_DRAG = 30;
const DISMISS_VELOCITY = 500;

const TOAST_CONFIG: Record<
  ToastType,
  { icon: ComponentProps<typeof Ionicons>["name"]; color: string }
> = {
  success: { icon: "checkmark-circle", color: "#34C759" },
  error: { icon: "close-circle", color: "#FF3B30" },
  info: { icon: "information-circle", color: "#007AFF" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const insets = useSafeAreaInsets();

  // 0 = hidden, 1 = shown. Drives slide, fade and scale together.
  const progress = useSharedValue(0);
  // Live finger offset while the user drags the toast.
  const dragY = useSharedValue(0);

  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  }, []);

  useEffect(() => clearHideTimer, [clearHideTimer]);

  const unmountToast = useCallback(() => {
    setToast(null);
    dragY.set(0);
  }, [dragY]);

  const hideToast = useCallback(() => {
    clearHideTimer();
    // Unmount only once the exit animation has really finished; if a new
    // toast interrupts it, `finished` is false and the new one stays.
    progress.set(
      withTiming(
        0,
        { duration: 200, easing: Easing.in(Easing.cubic) },
        (finished) => {
          "worklet";
          if (finished) scheduleOnRN(unmountToast);
        },
      ),
    );
  }, [clearHideTimer, progress, unmountToast]);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(hideToast, VISIBLE_MS);
  }, [clearHideTimer, hideToast]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });
      // .set() rather than assigning .value keeps the React Compiler happy.
      dragY.set(0);
      progress.set(0);
      progress.set(withSpring(1, { duration: 450, dampingRatio: 0.75 }));
      scheduleHide();
    },
    [dragY, progress, scheduleHide],
  );

  // Swipe up to dismiss; the auto-hide timer pauses while the finger is down.
  const panActivated = useSharedValue(false);
  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    onBegin: () => {
      "worklet";
      scheduleOnRN(clearHideTimer);
    },
    onActivate: () => {
      "worklet";
      panActivated.set(true);
    },
    onUpdate: (e) => {
      "worklet";
      dragY.set(e.translationY);
    },
    onDeactivate: (e) => {
      "worklet";
      if (e.translationY < -DISMISS_DRAG || e.velocityY < -DISMISS_VELOCITY) {
        scheduleOnRN(hideToast);
      } else {
        dragY.set(withSpring(0, { duration: 300, dampingRatio: 0.8 }));
        scheduleOnRN(scheduleHide);
      }
    },
    onFinalize: () => {
      "worklet";
      // Finger lifted without dragging (a tap, or nothing): resume the timer.
      // A tap then hides the toast anyway.
      if (!panActivated.get()) scheduleOnRN(scheduleHide);
      panActivated.set(false);
    },
  });

  const tap = useTapGesture({
    onActivate: () => {
      "worklet";
      scheduleOnRN(hideToast);
    },
  });

  const gesture = useExclusiveGestures(pan, tap);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.get();
    const drag = dragY.get();
    // Follow the finger upwards; resist (rubber-band) when pulled down.
    const dragOffset = drag < 0 ? drag : drag * 0.2;
    return {
      opacity: interpolate(p, [0, 1], [0, 1], Extrapolation.CLAMP),
      transform: [
        { translateY: interpolate(p, [0, 1], [-SLIDE_DISTANCE, 0]) + dragOffset },
        { scale: interpolate(p, [0, 1], [0.92, 1]) },
      ],
    };
  });

  const config = toast ? TOAST_CONFIG[toast.type] : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && config && (
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={[
              styles.toastContainer,
              { top: insets.top + 8 },
              animatedStyle,
            ]}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
            accessibilityHint="Tap or swipe up to dismiss"
          >
            <View style={[styles.toast, { borderLeftColor: config.color }]}>
              <Ionicons name={config.icon} size={24} color={config.color} />
              <Text style={styles.toastText}>{toast.message}</Text>
            </View>
          </Animated.View>
        </GestureDetector>
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
