import { Book } from "@/utils/types";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function BookDetailPage() {
  const { bookData } = useLocalSearchParams();
  const book: Book = JSON.parse(bookData as string);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionLength = (book?.volumeInfo?.description?.length ?? 300) / 2;

  const db = useSQLiteContext();

  const addBookToDatabase = async () => {
    const {
      title,
      subtitle,
      authors,
      publisher,
      publishedDate,
      description,
      pageCount,
      categories,
      imageLinks,
    } = book.volumeInfo;

    const result = await db.runAsync(
      `INSERT INTO books (title, subtitle, authors, publisher, publishedDate, description, pageCount, categories, smallThumbnail, thumbnail, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        subtitle || null,
        authors ? authors.join(", ") : null,
        publisher || null,
        publishedDate || null,
        description || null,
        pageCount || null,
        categories ? categories.join(", ") : null,
        imageLinks?.smallThumbnail || null,
        imageLinks?.thumbnail || null,
        "TO_READ",
      ],
    );
    return result;
  };

  const handleAddBook = async () => {
    try {
      await addBookToDatabase();
      alert(`Book added successfully!`);
    } catch (error) {
      console.error("Error adding book to database:", error);
      alert(
        `Failed to add book: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: book.volumeInfo.title,
          headerShown: true,
        }}
      />
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.headContainer}>
              <Image
                source={{
                  uri: book.volumeInfo.imageLinks?.thumbnail?.replace(
                    "http://",
                    "https://",
                  ),
                }}
                style={styles.coverImage}
                resizeMode="cover"
              />

              <View style={styles.metadataContainer}>
                {book.volumeInfo.categories && (
                  <View>
                    <Text style={styles.categoriesLabel}>Categories</Text>
                    <View style={styles.categoriesWrapper}>
                      {book.volumeInfo.categories.map((category, index) => (
                        <View key={index} style={styles.categoryChip}>
                          <Text style={styles.categoryText}>{category}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {book.volumeInfo.publishedDate && (
                  <View>
                    <Text style={styles.metadataLabel}>Published</Text>
                    <Text style={styles.metadataValue}>
                      {book.volumeInfo.publishedDate}
                    </Text>
                  </View>
                )}

                {book.volumeInfo.pageCount && (
                  <View>
                    <Text style={styles.metadataLabel}>Pages</Text>
                    <Text style={styles.metadataValue}>
                      {book.volumeInfo.pageCount}
                    </Text>
                  </View>
                )}

                {book.volumeInfo.publisher && (
                  <View>
                    <Text style={styles.metadataLabel}>Publisher</Text>
                    <Text style={styles.metadataValue}>
                      {book.volumeInfo.publisher}
                    </Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{book.volumeInfo.title}</Text>

              {book.volumeInfo.subtitle && (
                <Text style={styles.subtitle}>{book.volumeInfo.subtitle}</Text>
              )}

              {book.volumeInfo.authors && (
                <Text style={styles.authors}>
                  by {book.volumeInfo.authors.join(", ")}
                </Text>
              )}

              {book.volumeInfo.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={styles.description}>
                    {isDescriptionExpanded ||
                    book.volumeInfo.description.length <= descriptionLength
                      ? book.volumeInfo.description
                      : book.volumeInfo.description.substring(
                          0,
                          descriptionLength,
                        ) + "..."}
                  </Text>
                  {book.volumeInfo.description.length > descriptionLength && (
                    <TouchableOpacity
                      onPress={() =>
                        setIsDescriptionExpanded(!isDescriptionExpanded)
                      }
                    >
                      <Text style={styles.readMoreText}>
                        {isDescriptionExpanded ? "Read less" : "Read more"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              <Button
                color="#4caf50"
                title="Aggiungi libro"
                onPress={handleAddBook}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
    alignItems: "center",
  },
  headContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
  },
  coverImage: {
    aspectRatio: 2 / 3,
    height: "100%",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    maxWidth: 150,
  },
  infoContainer: {
    padding: 30,
    maxWidth: 1080,
    display: "flex",
    flexDirection: "column",
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  authors: {
    color: "#999",
    fontSize: 16,
    fontStyle: "italic",
    marginBottom: 20,
  },
  metadataContainer: {
    flexDirection: "column",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 5,
  },
  metadataLabel: {
    color: "#999",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "right",
  },
  metadataValue: {
    textAlign: "right",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  categoriesLabel: {
    textAlign: "right",
    color: "#999",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  categoriesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    backgroundColor: "#3a3f47",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  categoryText: {
    color: "#fff",
    fontSize: 14,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    color: "#999",
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  description: {
    color: "#ccc",
    fontSize: 16,
    lineHeight: 24,
  },
  readMoreText: {
    color: "#8f8f8fff",
    marginTop: 8,
    fontStyle: "italic",
  },
  addButton: {
    backgroundColor: "#4caf50",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
});
