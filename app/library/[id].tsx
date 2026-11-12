import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Background from "@/components/Background";
import StatusBadge from "@/components/StatusBadge";
import BookActionSheet from "@/components/home/BookAction";
import ReadingSessions from "@/components/library/ReadingSessions";
import TagEditor from "@/components/library/TagEditor";
import { useToast } from "@/components/Toast";
import { deleteBook, updateBookStatus } from "@/services/booksRepository";
import {
  addSession,
  addTagToBook,
  deleteSession,
  getAllTagNames,
  getBookTags,
  getLibraryBook,
  getSessions,
  removeTagFromBook,
  syncStatusFromSessions,
  updateNotes,
  updateSession,
} from "@/services/readingRepository";
import { STATUS_META } from "@/utils/bookStatus";
import { mainWhite } from "@/utils/styles";
import { BookStatus, DBBook, ReadingDates, ReadingSession } from "@/utils/types";

const PLACEHOLDER_COVER = require("@/assets/images/image-error.png");
const NOTES_SAVE_DELAY_MS = 600;

type NotesState = "idle" | "saving" | "saved";

export default function LibraryBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookId = Number(id);
  const router = useRouter();
  const db = useSQLiteContext();
  const { showToast } = useToast();

  const [book, setBook] = useState<DBBook | null>(null);
  const [missing, setMissing] = useState(false);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [notesState, setNotesState] = useState<NotesState>("idle");
  const [sheetVisible, setSheetVisible] = useState(false);

  const goBack = useCallback(
    () => (router.canGoBack() ? router.back() : router.replace("/")),
    [router],
  );

  const fail = useCallback(
    (message: string) => (error: unknown) => {
      console.error(message, error);
      showToast(message, "error");
    },
    [showToast],
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getLibraryBook(db, bookId),
      getSessions(db, bookId),
      getAllTagNames(db),
    ])
      .then(([loaded, loadedSessions, tagNames]) => {
        if (cancelled) return;
        if (!loaded) {
          setMissing(true);
          return;
        }
        setBook(loaded);
        setNotes(loaded.notes ?? "");
        setSessions(loadedSessions);
        setAllTags(tagNames);
      })
      .catch(fail("Couldn't load this book"));
    return () => {
      cancelled = true;
    };
  }, [db, bookId, fail]);

  // ------------------------------------------------------------ Notes
  // Saved shortly after typing stops, and on leaving the screen.
  const pendingNotes = useRef<string | null>(null);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushNotes = useCallback(() => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = null;
    const value = pendingNotes.current;
    if (value === null) return;
    pendingNotes.current = null;
    setNotesState("saving");
    updateNotes(db, bookId, value)
      .then(() => setNotesState("saved"))
      .catch((error) => {
        setNotesState("idle");
        fail("Couldn't save your notes")(error);
      });
  }, [db, bookId, fail]);

  useEffect(() => flushNotes, [flushNotes]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesState("idle");
    pendingNotes.current = value;
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(flushNotes, NOTES_SAVE_DELAY_MS);
  };

  // --------------------------------------------------------- Sessions
  const afterSessionChange = async (current: DBBook) => {
    setSessions(await getSessions(db, bookId));
    const status = await syncStatusFromSessions(db, bookId, current.status);
    if (status !== current.status) {
      setBook({ ...current, status });
      showToast(`Marked as ${STATUS_META[status].label}`, "info");
    }
  };

  const handleAddSession = (dates: ReadingDates) => {
    if (!book) return;
    addSession(db, bookId, dates)
      .then(() => afterSessionChange(book))
      .catch(fail("Couldn't add the read-through"));
  };

  const handleUpdateSession = (sessionId: number, dates: ReadingDates) => {
    if (!book) return;
    const wasOpen = sessions.some((s) => s.id === sessionId && !s.finishedAt);
    updateSession(db, sessionId, dates)
      .then(() => {
        if (wasOpen && dates.finishedAt) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return afterSessionChange(book);
      })
      .catch(fail("Couldn't update the read-through"));
  };

  // Deleting a read-through never changes the status (see ReadingSessions).
  const handleDeleteSession = (sessionId: number) => {
    deleteSession(db, sessionId)
      .then(() => setSessions((prev) => prev.filter((s) => s.id !== sessionId)))
      .catch(fail("Couldn't delete the read-through"));
  };

  // ------------------------------------------------------------- Tags
  const refreshTags = async (current: DBBook) => {
    const [tags, tagNames] = await Promise.all([
      getBookTags(db, bookId),
      getAllTagNames(db),
    ]);
    setBook({ ...current, tags });
    setAllTags(tagNames);
  };

  const handleAddTag = (name: string) => {
    if (!book) return;
    addTagToBook(db, bookId, name)
      .then(() => refreshTags(book))
      .catch(fail("Couldn't add the tag"));
  };

  const handleRemoveTag = (name: string) => {
    if (!book) return;
    removeTagFromBook(db, bookId, name)
      .then(() => refreshTags(book))
      .catch(fail("Couldn't remove the tag"));
  };

  // --------------------------------------------------- Status / delete
  const handleStatusChange = (_id: number, status: BookStatus) => {
    if (!book) return;
    updateBookStatus(db, bookId, status)
      .then(() => setBook({ ...book, status }))
      .catch(fail("Couldn't update the status"));
  };

  const handleDelete = () => {
    deleteBook(db, bookId)
      .then(() => {
        showToast("Book removed from your library", "info");
        goBack();
      })
      .catch(fail("Couldn't delete the book"));
  };

  // ----------------------------------------------------------- Render
  if (missing || !book) {
    return (
      <Background>
        <SafeAreaView style={[styles.screen, styles.center]}>
          {missing ? (
            <>
              <Text style={styles.message}>This book is no longer in your library.</Text>
              <Pressable onPress={goBack} style={styles.backPill}>
                <Text style={styles.backPillText}>Go back</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator size="large" color={mainWhite} />
          )}
        </SafeAreaView>
      </Background>
    );
  }

  const cover = book.thumbnail ?? book.smallThumbnail;

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
          <Pressable
            onPress={() => setSheetVisible(true)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="More actions"
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={mainWhite} />
          </Pressable>
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
            <View style={styles.summary}>
              <Image
                source={cover ? { uri: cover } : PLACEHOLDER_COVER}
                style={styles.cover}
                contentFit="cover"
                cachePolicy="disk"
              />
              <View style={styles.summaryText}>
                <Text style={styles.title} numberOfLines={3}>
                  {book.title}
                </Text>
                {book.authors && (
                  <Text style={styles.authors} numberOfLines={2}>
                    {book.authors}
                  </Text>
                )}
                <Pressable
                  onPress={() => setSheetVisible(true)}
                  style={styles.statusPress}
                  accessibilityRole="button"
                  accessibilityLabel={`Status: ${STATUS_META[book.status].label}. Change status`}
                >
                  <StatusBadge status={book.status} showLabel />
                </Pressable>
              </View>
            </View>

            <Section title="Read-throughs">
              <ReadingSessions
                sessions={sessions}
                onAdd={handleAddSession}
                onUpdate={handleUpdateSession}
                onDelete={handleDeleteSession}
              />
            </Section>

            <Section
              title="Notes"
              trailing={
                notesState === "idle" ? null : (
                  <Text style={styles.savedText}>
                    {notesState === "saving" ? "Saving…" : "Saved"}
                  </Text>
                )
              }
            >
              <TextInput
                style={styles.notes}
                value={notes}
                onChangeText={handleNotesChange}
                onBlur={flushNotes}
                placeholder="Thoughts, quotes, where you left off…"
                placeholderTextColor="#777"
                multiline
                textAlignVertical="top"
                accessibilityLabel="Notes"
              />
            </Section>

            <Section title="Tags">
              <TagEditor
                tags={book.tags ?? []}
                allTags={allTags}
                onAdd={handleAddTag}
                onRemove={handleRemoveTag}
              />
            </Section>
          </ScrollView>
        </KeyboardAvoidingView>

        <BookActionSheet
          book={book}
          visible={sheetVisible}
          onClose={() => setSheetVisible(false)}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
        />
      </SafeAreaView>
    </Background>
  );
}

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {trailing}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    padding: 24,
  },
  message: {
    color: mainWhite,
    fontSize: 16,
    textAlign: "center",
  },
  backPill: {
    borderColor: mainWhite,
    borderWidth: 1,
    borderRadius: 100,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  backPillText: {
    color: mainWhite,
    fontSize: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  summary: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  cover: {
    width: 90,
    height: 135,
    borderRadius: 6,
    backgroundColor: "#2a2f37",
  },
  summaryText: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  title: {
    fontFamily: "Inter_700Bold",
    color: mainWhite,
    fontSize: 22,
  },
  authors: {
    fontFamily: "Inter_400Regular_Italic",
    color: "#999",
    fontSize: 15,
  },
  statusPress: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  section: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  savedText: {
    color: "#777",
    fontSize: 12,
  },
  notes: {
    minHeight: 120,
    color: mainWhite,
    fontSize: 15,
    lineHeight: 22,
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#0e1010",
  },
});
