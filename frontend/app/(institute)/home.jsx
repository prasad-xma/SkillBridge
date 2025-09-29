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
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";
import { useNavigation } from "@react-navigation/native";

export default function InstituteHome() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const navigation = useNavigation();

  const deviceWidth = Dimensions.get("window").width - 30; // padding adjustment

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);

      // Fetch courses from backend (replace with your backend URL)
      try {
        const response = await fetch("http://192.168.1.4:5000/courses");
        const data = await response.json();
        if (response.ok) setCourses(data);
      } catch (error) {
        console.log("Error fetching courses:", error);
      }
    })();
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <Text style={[styles.title, { color: theme.text }]}>
        Institute Details
      </Text>

      {user && (
        <Text style={[styles.welcomeText, { color: theme.text }]}>
          Welcome, {user.fullName}
        </Text>
      )}

      {/* Program Overview */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.cardTitle, { color: theme.text }]}>
          Program Overview
        </Text>

        <View style={styles.overviewRow}>
          <Ionicons
            name="bookmarks-sharp"
            size={24}
            color="#007bff"
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Total Courses
            </Text>
            <Text style={[styles.value, { color: theme.primary }]}>
              {courses.length}
            </Text>
          </View>
        </View>
      </View>

      {/* Courses List */}
      {courses.map((course) => (
        <View
          key={course._id}
          style={[
            styles.courseCard,
            { width: deviceWidth, backgroundColor: "#fff" },
          ]}
        >
          <Text style={styles.courseName}>{course.courseName}</Text>
          <Text style={styles.courseDuration}>Duration: {course.duration}</Text>
          <Text style={styles.courseFee}>Fee: ${course.fees}</Text>

          <TouchableOpacity
          // onPress={() => navigation.navigate("CourseDetails", { courseId: course._id })}
          >
            <Text style={styles.readMore}>Read more &gt;</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f9",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },

  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },

  /* General Card */
  card: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 20,
    backgroundColor: "#fff",
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 15,
  },

  overviewRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },

  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  /* Course Card */
  courseCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    height: 150, // fixed height
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: "#fff",
  },

  courseName: {
    fontSize: 20,
    fontWeight: "700",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
  },

  courseDuration: {
    fontSize: 14,
    marginTop: 5,
    color: "#555",
  },

  courseFee: {
    fontSize: 18,
    color: "#ff4d4f",
    fontWeight: "700",
  },

  readMore: {
    color: "#007bff",
    fontWeight: "700",
    marginTop: 5,
  },
});

