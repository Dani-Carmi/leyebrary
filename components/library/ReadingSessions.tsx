import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateField from "./DateField";
import { ReadingDates, ReadingSession } from "@/utils/types";
import { daysSpanned, today } from "@/utils/dates";
import {
  mainWhite,
  readStatusBorderColor,
  readingStatusBorderColor,
} from "@/utils/styles";

type Props = {
  sessions: ReadingSession[];
  onAdd: (dates: ReadingDates) => void;
  onUpdate: (id: number, dates: ReadingDates) => void;
  onDelete: (id: number) => void;
};

/** The read-throughs of a book: when each one started and finished. */
export default function ReadingSessions({
  sessions,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const finishedCount = sessions.filter((s) => s.finishedAt).length;
  const hasOpenSession = sessions.some((s) => s.startedAt && !s.finishedAt);
  const now = today();

  const confirmDelete = (session: ReadingSession, number: number) =>
    Alert.alert(
      `Delete read #${number}?`,
      "Its dates will be removed. The book's status won't change.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(session.id),
        },
      ],
    );

  return (
    <View>
      <Text style={styles.summary}>
        {finishedCount === 0
          ? "Not finished yet"
          : `Read ${finishedCount} time${finishedCount === 1 ? "" : "s"}`}
      </Text>

      {sessions.map((session, index) => {
        const number = index + 1;
        const { startedAt, finishedAt } = session;
        const span =
          startedAt && finishedAt ? daysSpanned(startedAt, finishedAt) : null;
        const ongoing = startedAt && !finishedAt ? daysSpanned(startedAt, now) : null;

        return (
          <View key={session.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Read #{number}</Text>
              <Pressable
                onPress={() => confirmDelete(session, number)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Delete read number ${number}`}
              >
                <Ionicons name="trash-outline" size={18} color="#888" />
              </Pressable>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Started</Text>
              {startedAt ? (
                <DateField
                  value={startedAt}
                  maximumDate={finishedAt ?? now}
                  onChange={(value) =>
                    onUpdate(session.id, { startedAt: value, finishedAt })
                  }
                  accessibilityLabel={`Start date of read ${number}`}
                />
              ) : (
                <SmallButton
                  label="Add start date"
                  onPress={() =>
                    onUpdate(session.id, {
                      startedAt: finishedAt ?? now,
                      finishedAt,
                    })
                  }
                />
              )}
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Finished</Text>
              {finishedAt ? (
                <DateField
                  value={finishedAt}
                  minimumDate={startedAt}
                  maximumDate={now}
                  onChange={(value) =>
                    onUpdate(session.id, { startedAt, finishedAt: value })
                  }
                  accessibilityLabel={`Finish date of read ${number}`}
                />
              ) : (
                <SmallButton
                  label="Mark finished today"
                  color={readStatusBorderColor}
                  onPress={() =>
                    onUpdate(session.id, { startedAt, finishedAt: now })
                  }
                />
              )}
            </View>

            {(span || ongoing) && (
              <Text style={styles.duration}>
                {span
                  ? `${span} day${span === 1 ? "" : "s"}`
                  : `In progress · day ${ongoing}`}
              </Text>
            )}
          </View>
        );
      })}

      <View style={styles.actions}>
        {!hasOpenSession && (
          <ActionButton
            icon="book-outline"
            label="Start reading today"
            color={readingStatusBorderColor}
            onPress={() => onAdd({ startedAt: now, finishedAt: null })}
          />
        )}
        <ActionButton
          icon="add"
          label="Log a past read"
          color={mainWhite}
          onPress={() => onAdd({ startedAt: now, finishedAt: now })}
        />
      </View>
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  color = mainWhite,
}: {
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.smallButton,
        { borderColor: color },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Text style={[styles.smallButtonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  color,
  onPress,
}: {
  icon: "book-outline" | "add";
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        { borderColor: color + "80" },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.actionText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#0e1010",
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    color: mainWhite,
    fontSize: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 36,
  },
  label: {
    color: "#999",
    fontSize: 14,
  },
  duration: {
    color: "#888",
    fontSize: 13,
    fontStyle: "italic",
  },
  smallButton: {
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  smallButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  pressed: {
    opacity: 0.6,
  },
});
