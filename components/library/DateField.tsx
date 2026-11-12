import { Platform, Pressable, StyleSheet, Text } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { formatDay, parseDateString, toDateString } from "@/utils/dates";
import { mainWhite } from "@/utils/styles";

type Props = {
  /** YYYY-MM-DD */
  value: string;
  onChange: (value: string) => void;
  minimumDate?: string | null;
  maximumDate?: string | null;
  accessibilityLabel: string;
};

const toDate = (value?: string | null) => parseDateString(value) ?? undefined;

/**
 * The platform's own date picker: iOS's compact field (opens a calendar),
 * or a button that opens Android's calendar dialog.
 */
export default function DateField({
  value,
  onChange,
  minimumDate,
  maximumDate,
  accessibilityLabel,
}: Props) {
  const current = parseDateString(value) ?? new Date();

  const handleChange = (event: DateTimePickerChangeEvent, date: Date) => {
    if (event && date) onChange(toDateString(date));
  };

  if (Platform.OS === "ios") {
    return (
      <DateTimePicker
        value={current}
        mode="date"
        display="compact"
        themeVariant="dark"
        accentColor="#FF9500"
        minimumDate={toDate(minimumDate)}
        maximumDate={toDate(maximumDate)}
        onValueChange={handleChange}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Pressable
      style={styles.androidField}
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}: ${formatDay(value)}`}
      onPress={() =>
        DateTimePickerAndroid.open({
          value: current,
          mode: "date",
          minimumDate: toDate(minimumDate),
          maximumDate: toDate(maximumDate),
          onValueChange: handleChange,
        })
      }
    >
      <Text style={styles.androidText}>{formatDay(value)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  androidField: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1a1d21",
  },
  androidText: {
    color: mainWhite,
    fontSize: 15,
  },
});
