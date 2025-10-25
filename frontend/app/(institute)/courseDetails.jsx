import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { themes } from "../../constants/colors";

export default function CourseDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const deviceWidth = Dimensions.get("window").width;

  // Parse course data from params
  const initialCourse = params?.course
    ? (() => {
        try {
          return JSON.parse(params.course);
        } catch (_) {
          return null;
        }
      })()
    : null;

  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(initialCourse);

  const courseId = (course?.id || course?._id || initialCourse?.id || initialCourse?._id);

  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await fetch(`http://192.168.1.4:5000/courses/${courseId}`);
      const data = await res.json();
      if (res.ok) setCourse(data);
    } catch (e) {
      // ignore fetch errors for now
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCourse();
      return undefined;
    }, [courseId])
  );

  if (!course) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff4d4f" />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Course not found
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return '#28a745';
      case 'intermediate':
        return '#ffc107';
      case 'advanced':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const renderChapter = ({ item, index }) => (
    <View style={[styles.chapterItem, { backgroundColor: theme.card }]}>
      <View style={styles.chapterNumber}>
        <Text style={[styles.chapterNumberText, { color: theme.primary }]}>
          {index + 1}
        </Text>
      </View>
      <Text style={[styles.chapterText, { color: theme.text }]}>{item}</Text>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Course Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Course Thumbnail */}
      {course.thumbnailUrl && (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Course Information */}
      <View style={[styles.contentContainer, { backgroundColor: theme.card }]}>
        <Text style={[styles.courseName, { color: theme.text }]}>
          {course.courseName}
        </Text>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {course.description}
        </Text>

        {/* Course Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
          <View style={styles.statItem}>
            <Ionicons name="folder-outline" size={20} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Category
            </Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              {course.category || "N/A"}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Duration
            </Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              {course.duration}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="cash-outline" size={20} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Fee
            </Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              ${course.fees}
            </Text>
          </View>
        </View>

        {/* Difficulty Badge */}
        {course.difficulty && (
          <View style={[styles.difficultyContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.difficultyLabel, { color: theme.textSecondary }]}>
              Difficulty Level
            </Text>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(course.difficulty) }]}>
              <Text style={styles.difficultyText}>{course.difficulty}</Text>
            </View>
          </View>
        )}

        {/* Course Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
              Created
            </Text>
            <Text style={[styles.metadataValue, { color: theme.text }]}>
              {formatDate(course.createdAt)}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.metadataValue, { color: theme.text }]}>
              {formatDate(course.updatedAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Course Chapters */}
      {course.chapters && course.chapters.length > 0 && (
        <View style={[styles.chaptersContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Course Chapters
          </Text>
          <FlatList
            data={course.chapters}
            renderItem={renderChapter}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Learning Outcomes */}
      {course.learningOutcomes && course.learningOutcomes.length > 0 && (
        <View style={[styles.chaptersContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Learning Outcomes
          </Text>
          <FlatList
            data={course.learningOutcomes}
            renderItem={renderChapter}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => {
            router.push({
              pathname: "/(institute)/editCourse",
              params: { course: JSON.stringify(course) },
            });
          }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Edit Course</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  thumbnailContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  thumbnail: {
    width: "100%",
    height: 200,
  },
  contentContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  courseName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    lineHeight: 30,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  difficultyLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  metadataContainer: {
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 16,
  },
  metadataItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  chaptersContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  chapterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  chapterNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  chapterText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  actionContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  backButtonText: {
    color: "#007bff",
    fontSize: 16,
    fontWeight: "600",
  },
});
