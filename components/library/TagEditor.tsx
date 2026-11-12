import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { normalizeText } from "@/utils/text";
import { MAX_TAG_LENGTH } from "@/utils/validation";
import { mainWhite } from "@/utils/styles";

const MAX_SUGGESTIONS = 6;

type Props = {
  tags: string[];
  /** Every tag used across the library, for suggestions. */
  allTags: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
};

/** The book's tags as removable chips, plus a field to add more. */
export default function TagEditor({ tags, allTags, onAdd, onRemove }: Props) {
  const [draft, setDraft] = useState("");

  const suggestions = useMemo(() => {
    const own = new Set(tags.map(normalizeText));
    const typed = normalizeText(draft.replace(/^#+/, ""));
    return allTags
      .filter((t) => !own.has(normalizeText(t)))
      .filter((t) => !typed || normalizeText(t).includes(typed))
      .slice(0, MAX_SUGGESTIONS);
  }, [allTags, tags, draft]);

  const submit = (name: string) => {
    if (!name.trim()) return;
    onAdd(name);
    setDraft("");
  };

  return (
    <View style={styles.container}>
      {tags.length > 0 && (
        <View style={styles.chips}>
          {tags.map((tag) => (
            <View key={tag} style={styles.chip}>
              <Text style={styles.chipText}>#{tag}</Text>
              <Pressable
                onPress={() => onRemove(tag)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${tag}`}
              >
                <Ionicons name="close" size={14} color="#bbb" />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <TextInput
        style={styles.input}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={() => submit(draft)}
        placeholder="Add a tag (e.g. sci-fi, book club)"
        placeholderTextColor="#777"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        submitBehavior="submit"
        maxLength={MAX_TAG_LENGTH}
        accessibilityLabel="Add a tag"
      />

      {suggestions.length > 0 && (
        <View style={styles.chips}>
          {suggestions.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => submit(tag)}
              style={({ pressed }) => [
                styles.suggestion,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Add tag ${tag}`}
            >
              <Ionicons name="add" size={14} color="#999" />
              <Text style={styles.suggestionText}>{tag}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#3a3f47",
    borderRadius: 100,
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    color: mainWhite,
    fontSize: 13,
  },
  input: {
    color: mainWhite,
    fontSize: 15,
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#0e1010",
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  suggestionText: {
    color: "#bbb",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.6,
  },
});
