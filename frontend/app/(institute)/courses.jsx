import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

export default function CoursesPage() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const navigation = useNavigation();

  const deviceWidth = Dimensions.get("window").width - 30; // padding adjustment

  const loadCourses = async () => {
    try {
      const response = await fetch("http://192.168.1.4:5000/courses");
      const data = await response.json();
      if (response.ok) setCourses(data);
    } catch (error) {
      console.log("Error fetching courses:", error);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch ((difficulty || '').toLowerCase()) {
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

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);
      await loadCourses();
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
      return undefined;
    }, [])
  );

  const onEditCourse = (course) => {
    try {
      router.push({ pathname: "/(institute)/editCourse", params: { course: JSON.stringify(course) } });
    } catch (e) {
      navigation?.navigate?.("editCourse", { course });
    }
  };

  const onReadMore = (course) => {
    try {
      router.push({ pathname: "/(institute)/courseDetails", params: { course: JSON.stringify(course) } });
    } catch (e) {
      navigation?.navigate?.("courseDetails", { course });
    }
  };

  const onDeleteCourse = (course) => {
    Alert.alert(
      "Delete Course",
      "Are you sure you want to delete this course?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const session = await getSession();
              const token = session?.idToken;
              const courseId = course.id || course._id;
              const response = await fetch(`http://192.168.1.4:5000/courses/delete/${courseId}` , {
                method: "DELETE",
                headers: { Authorization: token ? `Bearer ${token}` : "" },
              });
              let data = {};
              try { data = await response.json(); } catch (_) {}
              if (!response.ok) throw new Error(data.message || "Failed to delete course");
              setCourses((prev) => prev.filter((c) => (c.id || c._id) !== courseId));
              await loadCourses();
              Alert.alert("Success", "Course deleted successfully");
            } catch (err) {
              Alert.alert("Error", err.message || "Could not delete course");
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={[styles.headerContainer, styles.headerHero]}>
        <View style={styles.shapeOne} />
        <View style={styles.shapeTwo} />
        <Text style={[styles.headerTitle, { color: '#fff' }]}>Courses</Text>
        {user && (
          <Text style={[styles.headerSubtitle, { color: '#eaf2ff' }]}>Welcome, {user.fullName}</Text>
        )}
        
        
        <View style={[
          styles.programCard,
          { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 12 }
        ]}>
          <View style={styles.programRow}>
            <Ionicons name="document-outline" size={28} color="#ffffff" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.programLabel, { color: '#eaf2ff' }]}>Total Courses</Text>
              <Text style={[styles.programValue, { color: '#fff' }]}>{courses.length}</Text>
            </View>
          </View>
        </View>
      </View>
      

      {courses.map((course) => (
        <View
          key={course.id || course._id}
          style={[styles.courseCard, { width: deviceWidth, backgroundColor: '#fff' }]}
        >
          <View style={styles.courseHeader}>
            <View style={styles.courseTitleContainer}>
              <Ionicons name="school-sharp" size={24} color="#007bff" style={{ marginRight: 8 }} />
              <Text style={styles.courseName}>{course.courseName}</Text>
            </View>
            {!!course.difficulty && (
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(course.difficulty) }]}>
                <Text style={styles.difficultyText}>{course.difficulty}</Text>
              </View>
            )}
          </View>

          {!!course.category && (
            <Text style={styles.courseCategory}>Category: {course.category}</Text>
          )}
          {!!course.duration && (
            <Text style={styles.courseDuration}>Duration: {course.duration}</Text>
          )}
          {typeof course.fees !== 'undefined' && (
            <Text style={styles.courseFee}>Fee: ${course.fees}</Text>
          )}
          {course.description ? (
            <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
          ) : null}

          <View style={styles.courseActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => onEditCourse(course)}>
              <Ionicons name="create-outline" size={20} color="#007bff" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={() => onDeleteCourse(course)}>
              <Ionicons name="trash-sharp" size={20} color="#ff4d4f" />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.readMoreContainer} onPress={() => onReadMore(course)}>
              <Text style={styles.readMoreText}>Read more</Text>
              <Ionicons name="arrow-forward-outline" size={18} color="#007bff" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
      </ScrollView>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(institute)/addcourse")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f6f9' },
  headerContainer: { padding: 20 },
  headerHero: {
    backgroundColor: '#0d6efd',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    overflow: 'hidden',
    marginBottom: 16,
  },
  shapeOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -40,
  },
  shapeTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -110,
    left: -60,
  },
  headerTitle: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  headerSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 14 },
  programCard: { padding: 16 },
  headerAddBtn: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  headerAddText: { color: '#0d6efd', fontWeight: '700' },
  programRow: { flexDirection: 'row', alignItems: 'center' },
  programLabel: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  programValue: { fontSize: 20, fontWeight: '700' },

  courseCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    minHeight: 180,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: '#fff',
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  courseTitleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  courseName: { fontSize: 20, fontWeight: '700', flex: 1 },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  courseCategory: { fontSize: 14, color: '#666', marginBottom: 4 },
  courseDuration: { fontSize: 14, color: '#555', marginBottom: 8 },
  courseFee: { fontSize: 16, color: '#0f5132', fontWeight: '700', marginBottom: 8 },
  courseDescription: { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 10 },

  courseActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
   fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  actionText: { marginLeft: 5, fontWeight: '600', fontSize: 14 },
  readMoreContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  readMoreText: { color: '#007bff', fontWeight: '700', fontSize: 14 },

});
