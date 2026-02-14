import { useEffect, useMemo, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { BookStatus, DBBook } from "@/utils/types";
import {
  Text,
  ActivityIndicator,
  FlatList,
  View,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LibraryBookListItem from "./library-book-list-item";
import {
  mainWhite,
  toReadStatusBorderColor,
  readingStatusBorderColor,
  readStatusBorderColor,
} from "@/utils/styles";

type SortField = "createdAt" | "title";
type SortDirection = "asc" | "desc";
type StatusFilter = "ALL" | BookStatus;

const STATUS_FILTERS: { label: string; value: StatusFilter; color: string }[] =
  [
    { label: "All", value: "ALL", color: mainWhite },
    {
      label: "To Read",
      value: BookStatus.TO_READ,
      color: toReadStatusBorderColor,
    },
    {
      label: "Reading",
      value: BookStatus.READING,
      color: readingStatusBorderColor,
    },
    { label: "Read", value: BookStatus.READ, color: readStatusBorderColor },
  ];

export default function LibraryBookList() {
  const db = useSQLiteContext();
  const [isLoading, setIsLoading] = useState(true);
  const [books, setBooks] = useState<DBBook[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadBooks = async () => {
    try {
      const res = await db.getAllSync("SELECT * FROM books");
      setBooks(res as DBBook[]);
    } catch (error) {
      console.error("Error loading books from database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (bookId: string) => {
    try {
      db.runSync("DELETE FROM books WHERE id = ?", [bookId]);
      setBooks((prev) => prev.filter((b) => b.id !== bookId));
    } catch (error) {
      console.error("Error deleting book:", error);
    }
  };

  const handleStatusChange = (bookId: string, newStatus: BookStatus) => {
    try {
      db.runSync("UPDATE books SET status = ? WHERE id = ?", [
        newStatus,
        bookId,
      ]);
      setBooks((prev) =>
        prev.map((b) => (b.id === bookId ? { ...b, status: newStatus } : b)),
      );
    } catch (error) {
      console.error("Error updating book status:", error);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "title" ? "asc" : "desc");
    }
  };

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          (b.authors && b.authors.toLowerCase().includes(q)),
      );
    }

    if (statusFilter !== "ALL") {
      result = result.filter((b) => b.status === statusFilter);
    }

    result.sort((a, b) => {
      let cmp: number;
      if (sortField === "title") {
        cmp = a.title.localeCompare(b.title);
      } else {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [books, searchQuery, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    loadBooks();
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [books]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1e90ff" />
      </View>
    );
  }

  if (books.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
          Your library is empty. Start adding some books!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your library..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={18} color="#999" />
            </Pressable>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.value;
            return (
              <Pressable
                key={filter.value}
                onPress={() => setStatusFilter(filter.value)}
                style={[
                  styles.filterChip,
                  {
                    borderColor: isActive ? filter.color : "#3a3f47",
                    backgroundColor: isActive
                      ? filter.color + "20"
                      : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? filter.color : "#999" },
                  ]}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sort Buttons */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by</Text>
          <Pressable
            onPress={() => toggleSort("createdAt")}
            style={[
              styles.sortButton,
              sortField === "createdAt" && styles.sortButtonActive,
            ]}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortField === "createdAt" && styles.sortButtonTextActive,
              ]}
            >
              Date
            </Text>
            {sortField === "createdAt" && (
              <Ionicons
                name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
                size={14}
                color={mainWhite}
                style={{ marginLeft: 4 }}
              />
            )}
          </Pressable>
          <Pressable
            onPress={() => toggleSort("title")}
            style={[
              styles.sortButton,
              sortField === "title" && styles.sortButtonActive,
            ]}
          >
            <Text
              style={[
                styles.sortButtonText,
                sortField === "title" && styles.sortButtonTextActive,
              ]}
            >
              Title
            </Text>
            {sortField === "title" && (
              <Ionicons
                name={sortDirection === "asc" ? "arrow-up" : "arrow-down"}
                size={14}
                color={mainWhite}
                style={{ marginLeft: 4 }}
              />
            )}
          </Pressable>
        </View>
      </View>

      {/* Results */}
      {filteredBooks.length === 0 ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: "#999", fontSize: 16, textAlign: "center" }}>
            No books match your filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={({ item }) => (
            <LibraryBookListItem
              item={item}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          )}
          keyExtractor={(item) => item.id}
          style={{ marginBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#3a3f47",
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: "#0e1010",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: mainWhite,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  clearButton: {
    padding: 4,
  },
  // Filter chips
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  // Sort
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sortLabel: {
    color: "#999",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#3a3f47",
  },
  sortButtonActive: {
    borderColor: mainWhite,
    backgroundColor: mainWhite + "15",
  },
  sortButtonText: {
    color: "#999",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  sortButtonTextActive: {
    color: mainWhite,
    fontFamily: "Inter_600SemiBold",
  },
});
