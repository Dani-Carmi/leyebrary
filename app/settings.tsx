import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import Background from "@/components/Background";
import { useToast } from "@/components/Toast";
import {
  hasBuiltInApiKey,
  setUserApiKey,
  verifyApiKey,
} from "@/services/googleBooksApi";
import {
  deleteUserApiKey,
  isPlausibleApiKey,
  loadUserApiKey,
  saveUserApiKey,
} from "@/services/userApiKey";
import { mainWhite } from "@/utils/styles";

const BOOKS_API_CONSOLE_URL =
  "https://console.cloud.google.com/apis/library/books.googleapis.com";

const KEY_STEPS = [
  "Open the Google Cloud Console (button below) and sign in with a Google account.",
  "Create a project if asked (any name works), then press Enable on the Books API.",
  "Go to APIs & Services → Credentials → Create credentials → API key.",
  "Recommended: edit the key and, under API restrictions, allow only the Books API.",
  "Copy the key and paste it above.",
];

/** Shows only the end of a key, so it can be recognised but not copied. */
const maskKey = (key: string) => `••••${key.slice(-4)}`;

export default function SettingsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [checking, setChecking] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const goBack = useCallback(
    () => (router.canGoBack() ? router.back() : router.replace("/")),
    [router],
  );

  useEffect(() => {
    let cancelled = false;
    loadUserApiKey()
      .then((key) => {
        if (!cancelled) setSavedKey(key);
      })
      .catch((error) => console.warn("Couldn't read the saved API key:", error))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async () => {
    const key = draft.trim();
    if (!isPlausibleApiKey(key)) {
      setDraftError("That doesn't look like a Google API key (it usually starts with “AIza”).");
      return;
    }
    setChecking(true);
    setDraftError(null);
    try {
      const problem = await verifyApiKey(key);
      if (problem) {
        setDraftError(problem);
        return;
      }
      await saveUserApiKey(key);
      setUserApiKey(key);
      setSavedKey(key);
      setDraft("");
      showToast("API key saved", "success");
    } catch (error) {
      console.error("Couldn't save the API key:", error);
      setDraftError("Couldn't save the key on this device.");
    } finally {
      setChecking(false);
    }
  };

  const removeKey = async () => {
    try {
      await deleteUserApiKey();
      setUserApiKey(null);
      setSavedKey(null);
      showToast("API key removed", "info");
    } catch (error) {
      console.error("Couldn't remove the API key:", error);
      showToast("Couldn't remove the key", "error");
    }
  };

  const confirmRemove = () =>
    Alert.alert(
      "Remove your API key?",
      hasBuiltInApiKey
        ? "Searches will go back to the app's built-in key."
        : "Searches will not be enabled.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: removeKey },
      ],
    );

  const status = savedKey
    ? `Using your own key (${maskKey(savedKey)}).`
    : hasBuiltInApiKey
      ? "Currently using the app's built-in key.\nYou can add your own to use your own quota."
      : "No key set. Searches are not enabled. Add your own key.";

  return (
    <Background>
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={26} color={mainWhite} />
          </Pressable>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Google Books API key</Text>
            <Text style={styles.body}>
              Leyebrary searches books via Google Books API.
            </Text>
            <Text style={styles.body}>
              To enable searches, add your own key. The key stays on your device.
            </Text>

            {loading ? (
              <ActivityIndicator color={mainWhite} style={styles.spinner} />
            ) : (
              <>
                <View style={styles.statusRow}>
                  <Ionicons
                    name={savedKey || hasBuiltInApiKey ? "checkmark-circle" : "alert-circle"}
                    size={18}
                    color={savedKey || hasBuiltInApiKey ? "#34C759" : "#FF9500"}
                  />
                  <Text style={styles.statusText}>{status}</Text>
                </View>

                <TextInput
                  style={[styles.input, draftError && styles.inputError]}
                  value={draft}
                  onChangeText={(text) => {
                    setDraft(text);
                    setDraftError(null);
                  }}
                  placeholder={savedKey ? "Paste a new key to replace it" : "Paste your key (AIza…)"}
                  placeholderTextColor="#777"
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  textContentType="none"
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  editable={!checking}
                />
                {draftError && <Text style={styles.errorText}>{draftError}</Text>}

                <View style={styles.buttonRow}>
                  <Pressable
                    onPress={handleSave}
                    disabled={checking || !draft.trim()}
                    style={[
                      styles.primaryButton,
                      (checking || !draft.trim()) && styles.buttonDisabled,
                    ]}
                    accessibilityRole="button"
                  >
                    {checking ? (
                      <ActivityIndicator size="small" color={mainWhite} />
                    ) : (
                      <Text style={styles.buttonText}>Check & save</Text>
                    )}
                  </Pressable>
                  {savedKey && (
                    <Pressable
                      onPress={confirmRemove}
                      disabled={checking}
                      style={styles.secondaryButton}
                      accessibilityRole="button"
                    >
                      <Text style={styles.removeText}>Remove key</Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, styles.stepsTitle]}>
              How to get a free key
            </Text>
            {KEY_STEPS.map((step, index) => (
              <View key={step} style={styles.step}>
                <Text style={styles.stepNumber}>{index + 1}</Text>
                <Text style={styles.body}>{step}</Text>
              </View>
            ))}
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(BOOKS_API_CONSOLE_URL)}
              style={[styles.secondaryButton, styles.consoleButton]}
              accessibilityRole="link"
            >
              <Ionicons name="open-outline" size={16} color={mainWhite} />
              <Text style={styles.buttonText}>Open Google Cloud Console</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    color: mainWhite,
    fontSize: 18,
  },
  headerSpacer: {
    width: 26,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 60,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    color: mainWhite,
    fontSize: 17,
    marginBottom: 8,
  },
  stepsTitle: {
    marginTop: 36,
  },
  body: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    color: "#bbb",
    fontSize: 14,
    lineHeight: 20,
  },
  spinner: {
    marginTop: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 16,
    marginBottom: 12,
  },
  statusText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    color: mainWhite,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: "#0e1010",
    color: mainWhite,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: "#ff6b6b",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 6,
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },
  primaryButton: {
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff30",
    borderColor: "#007bff",
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: mainWhite,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  removeText: {
    color: "#ff6b6b",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  step: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  stepNumber: {
    width: 20,
    fontFamily: "Inter_700Bold",
    color: mainWhite,
    fontSize: 14,
    lineHeight: 20,
  },
  consoleButton: {
    alignSelf: "flex-start",
    marginTop: 18,
  },
});
