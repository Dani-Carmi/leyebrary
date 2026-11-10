import { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { BookStatus } from "@/utils/types";
import {
  readStatusBgColor,
  readStatusBorderColor,
  readingStatusBgColor,
  readingStatusBorderColor,
  toReadStatusBgColor,
  toReadStatusBorderColor,
} from "@/utils/styles";

type StatusMeta = {
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  bgColor: string;
  borderColor: string;
};

export const STATUS_META: Record<BookStatus, StatusMeta> = {
  [BookStatus.TO_READ]: {
    label: "To read",
    icon: "time-outline",
    bgColor: toReadStatusBgColor,
    borderColor: toReadStatusBorderColor,
  },
  [BookStatus.READING]: {
    label: "Reading",
    icon: "book-outline",
    bgColor: readingStatusBgColor,
    borderColor: readingStatusBorderColor,
  },
  [BookStatus.READ]: {
    label: "Read",
    icon: "bookmark-outline",
    bgColor: readStatusBgColor,
    borderColor: readStatusBorderColor,
  },
};
