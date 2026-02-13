import Background from "@/components/background";
import CustomButton from "@/components/customButton";
import { Book, BookStatus } from "@/utils/types";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SearchBookItemDetailsProps {
  book: Book;
  onAddBook?: (status: BookStatus) => void;
}

export default function SearchBookItemDetails({
  book,
  onAddBook,
}: SearchBookItemDetailsProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionLength = (book?.volumeInfo?.description?.length ?? 300) / 2;

  return (
    <Background>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            {book.volumeInfo.categories ? (
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
            ) : null}

            {book.volumeInfo.publishedDate ? (
              <View>
                <Text style={styles.metadataLabel}>Published</Text>
                <Text style={styles.metadataValue}>
                  {book.volumeInfo?.publishedDate}
                </Text>
              </View>
            ) : null}

            {book.volumeInfo.pageCount ? (
              <View>
                <Text style={styles.metadataLabel}>Pages</Text>
                <Text style={styles.metadataValue}>
                  {book.volumeInfo?.pageCount}
                </Text>
              </View>
            ) : null}

            {book.volumeInfo.publisher ? (
              <View>
                <Text style={styles.metadataLabel}>Publisher</Text>
                <Text style={styles.metadataValue}>
                  {book.volumeInfo?.publisher}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title}>{book.volumeInfo.title}</Text>

          {book.volumeInfo.subtitle ? (
            <Text style={styles.subtitle}>{book.volumeInfo.subtitle}</Text>
          ) : null}

          {book.volumeInfo.authors ? (
            <Text style={styles.authors}>
              by {book.volumeInfo.authors.join(", ")}
            </Text>
          ) : null}

          {book.volumeInfo.description ? (
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
          ) : null}
        </View>
      </ScrollView>
      {onAddBook && (
        <View style={styles.buttonContainer}>
          <CustomButton
            icon="time-outline"
            onPress={() => onAddBook(BookStatus.TO_READ)}
          />
          <CustomButton
            icon="book-outline"
            onPress={() => onAddBook(BookStatus.READING)}
          />
          <CustomButton
            icon="bookmark-outline"
            onPress={() => onAddBook(BookStatus.READ)}
          />
        </View>
      )}
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#0000000f",
    borderBottomWidth: 1,
    borderBottomColor: "#3a3f47",
  },
  coverImage: {
    aspectRatio: 2 / 3,
    height: 200,
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
    padding: 20,
    maxWidth: 1080,
    paddingBottom: 100,
  },
  title: {
    fontFamily: "Inter_700Bold",
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_600SemiBold",
    color: "#bbb",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  authors: {
    fontFamily: "Inter_400Regular_Italic",
    color: "#888",
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
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 4,
    textAlign: "right",
    letterSpacing: 0.5,
  },
  metadataValue: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  categoriesLabel: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    color: "#888",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  categoriesWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  categoryChip: {
    backgroundColor: "#3a3f47",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#4a5057",
  },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    fontSize: 13,
  },
  descriptionContainer: {
    marginBottom: 20,
    backgroundColor: "#11132ab4",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3a3f47",
  },
  descriptionLabel: {
    fontFamily: "Inter_600SemiBold",
    color: "#888",
    fontSize: 11,
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  description: {
    fontFamily: "Inter_400Regular",
    color: "#ccc",
    fontSize: 15,
    lineHeight: 24,
  },
  readMoreText: {
    fontFamily: "Inter_400Regular_Italic",
    color: "#888",
    marginTop: 8,
    fontStyle: "italic",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 20,
  },
});
