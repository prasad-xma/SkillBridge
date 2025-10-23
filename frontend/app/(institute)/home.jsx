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
  ActivityIndicator,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";

export default function InstituteHome() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const navigation = useNavigation();

  const deviceWidth = Dimensions.get("window").width - 30; // padding adjustment

  const loadCourses = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch("http://192.168.1.4:5000/courses");
      const data = await response.json();
      if (response.ok) setCourses(data);
      else setError(data?.message || "Failed to load courses");
    } catch (error) {
      console.log("Error fetching courses:", error);
      setError("Could not fetch courses");
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const res = await fetch("http://192.168.1.4:5000/skills");
      const data = await res.json();
      if (res.ok) setSkills(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore gracefully for home summary
    }
  };

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);

      await Promise.all([loadCourses(), loadSkills()]);
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCourses();
      loadSkills();
      return undefined;
    }, [])
  );

  const onEditCourse = (course) => {
    // Navigate using expo-router and pass course via params
    try {
      router.push({
        pathname: "/(institute)/editCourse",
        params: { course: JSON.stringify(course) },
      });
    } catch (e) {
      // fallback to react-navigation if available
      navigation?.navigate?.("editCourse", { course });
    }
  };

  const onReadMore = (course) => {
    try {
      router.push({
        pathname: "/(institute)/courseDetails",
        params: { course: JSON.stringify(course) },
      });
    } catch (e) {
      // fallback to react-navigation if available
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
              const courseId = course.id || course._id; // Use id field from backend

              const response = await fetch(
                `http://192.168.1.4:5000/courses/delete/${courseId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                  },
                }
              );

              let data = {};
              try {
                data = await response.json();
              } catch (_) {}
              if (!response.ok) {
                throw new Error(data.message || "Failed to delete course");
              }

              // Optimistically update local state and then refetch to reflect DB
              setCourses((prev) =>
                prev.filter((c) => (c.id || c._id) !== courseId)
              );
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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View
        style={[
          styles.headerContainer,
          styles.headerHero,
          { backgroundColor: theme.primary },
        ]}
      >
        <View style={styles.shapeOne} />
        <View style={styles.shapeTwo} />
        {/* Header Title */}
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>
          Institute
        </Text>

        {/* Welcome User */}
        {user && (
          <Text style={[styles.headerSubtitle, { color: theme.headerText }]}>
            Welcome, {user.fullName}
          </Text>
        )}

        {/* Program Overview Card */}
        <View
          style={[
            styles.programCard,
            {
              backgroundColor: "rgba(255,255,255,0.12)",
              borderColor: "rgba(255,255,255,0.2)",
              borderWidth: 1,
              borderRadius: 12,
            },
          ]}
        >
          <View style={styles.programRow}>
            <Ionicons
              name="bookmarks-outline"
              size={28}
              color={theme.headerText}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.programLabel, { color: theme.headerText }]}>
                Total Courses
              </Text>
              <Text style={[styles.programValue, { color: theme.headerText }]}>
                {courses.length}
              </Text>
            </View>
            <Ionicons
              name="bulb-outline"
              size={28}
              color={theme.headerText}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.programLabel, { color: theme.headerText }]}>
                Total Skills
              </Text>
              <Text style={[styles.programValue, { color: theme.headerText }]}>
                {skills.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.card2, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search"
          size={18}
          color={theme.textSecondary}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search courses and skills"
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {!!searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            Loading courses...
          </Text>
        </View>
      )}

      {!!error && !loading && (
        <View style={styles.centerState}>
          <Ionicons name="warning-outline" size={22} color={theme.toastError} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[
              styles.retryBtn,
              { backgroundColor: theme.secondarySurface },
            ]}
            onPress={loadCourses}
          >
            <Text style={[styles.retryText, { color: theme.primary }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && courses.length === 0 && (
        <View style={styles.centerState}>
          <Ionicons name="school-outline" size={26} color={theme.primary} />
          <Text style={[styles.stateText, { color: theme.textSecondary }]}>
            No courses found
          </Text>
        </View>
      )}

      {/* Latest Courses */}
      {!loading && !error && courses.length > 0 && (
        <View style={{ marginTop: 20, backgroundColor: theme.card }}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.textSecondary,
                  fontWeight: "bold",
                  marginTop: 20,
                  marginStart: 10,
                },
              ]}
            >
              Latest Courses
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(institute)/courses")}
            >
              <Text style={[styles.sectionLink, { color: theme.primary }]}>
                Read more
              </Text>
            </TouchableOpacity>
          </View>
          {(() => {
            const q = searchQuery.trim().toLowerCase();
            const filteredCourses = !q
              ? courses
              : courses.filter(
                  (c) =>
                    (c?.courseName || "").toLowerCase().includes(q) ||
                    (c?.category || "").toLowerCase().includes(q) ||
                    (c?.description || "").toLowerCase().includes(q)
                );
            const items = [...filteredCourses]
              .sort(
                (a, b) =>
                  new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
              )
              .slice(0, 4);
            return (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  paddingHorizontal: 12,
                  paddingBottom: 6,
                }}
              >
                {items.length === 0 ? (
                  <Text
                    style={{ color: theme.textSecondary, paddingVertical: 10 }}
                  >
                    No matching courses
                  </Text>
                ) : (
                  items.map((item, index) => (
                    <View
                      key={String(item?.id || item?._id || index)}
                      style={[
                        styles.miniCard,
                        { backgroundColor: theme.card2 },
                      ]}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: 6,
                        }}
                      >
                        <Ionicons
                          name="school-sharp"
                          size={18}
                          color={theme.primary}
                        />
                        <Text
                          style={[
                            styles.smallTitle,
                            [styles.value, { color: theme.text }],
                            { marginLeft: 8 },
                          ]}
                          numberOfLines={1}
                        >
                          {item.courseName}
                        </Text>
                      </View>
                      {!!item.category && (
                        <View
                          style={[
                            styles.badge,
                            {
                              alignSelf: "flex-start",
                              marginTop: 2,
                              backgroundColor: theme.secondarySurface,
                            },
                          ]}
                        >
                          <Ionicons
                            name="pricetag-sharp"
                            size={12}
                            color={theme.primary}
                          />
                          <Text
                            style={[
                              styles.badgeText,
                              { marginLeft: 4, color: theme.secondary },
                            ]}
                          >
                            {item.category}
                          </Text>
                        </View>
                      )}
                      {!!item.description && (
                        <Text
                          style={[
                            styles.smallDesc,
                            { marginLeft: 4, color: theme.secondary },
                          ]}
                          numberOfLines={2}
                        >
                          {item.description}
                        </Text>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.smallBtn,
                          { backgroundColor: theme.primary },
                        ]}
                        onPress={() => onReadMore(item)}
                      >
                        <Text
                          style={[
                            styles.smallBtnText,
                            { color: theme.headerText },
                          ]}
                        >
                          View
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            );
          })()}
        </View>
      )}

      {/* Latest Skills */}
      <View
        style={{ marginTop: 20, marginBottom: 30, backgroundColor: theme.card }}
      >
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.label,
              {
                color: theme.textSecondary,
                marginTop: 20,
                fontWeight: "bold",
                marginStart: 10,
              },
            ]}
          >
            Latest Skills
          </Text>
          <TouchableOpacity onPress={() => router.push("/(institute)/skills")}>
            <Text style={[styles.sectionLink, { color: theme.primary }]}>
              Read more
            </Text>
          </TouchableOpacity>
        </View>
        {(() => {
          const q = searchQuery.trim().toLowerCase();
          const filteredSkills = !q
            ? skills
            : skills.filter(
                (s) =>
                  (s?.skillName || "").toLowerCase().includes(q) ||
                  (s?.category || "").toLowerCase().includes(q) ||
                  (s?.description || "").toLowerCase().includes(q)
              );
          const items = [...filteredSkills]
            .sort(
              (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
            )
            .slice(0, 4);
          if (items.length === 0) {
            return (
              <Text style={{ color: theme.textSecondary, paddingVertical: 10 }}>
                No matching skills
              </Text>
            );
          }
          return (
            <View style={{ flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', paddingHorizontal: 12, paddingBottom: 6 }}>
              {items.map((item, index) => (
                <View
                  key={String(item?.id || item?._id || index)}
                  style={[styles.miniCard, { backgroundColor: theme.card2 }]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Ionicons name="bulb-outline" size={18} color={theme.primary} />
                    <Text
                      style={[
                        styles.smallTitle,
                        [styles.value, { color: theme.text }],
                        { marginLeft: 8 },
                      ]}
                      numberOfLines={1}
                    >
                      {item.skillName}
                    </Text>
                  </View>
                  {!!item.category && (
                    <View
                      style={[
                        styles.badge,
                        {
                          alignSelf: "flex-start",
                          marginTop: 2,
                          backgroundColor: theme.secondarySurface,
                        },
                      ]}
                    >
                      <Ionicons
                        name="pricetag-sharp"
                        size={12}
                        color={theme.primary}
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { marginLeft: 4, color: theme.secondary },
                        ]}
                      >
                        {item.category}
                      </Text>
                    </View>
                  )}
                  {!!item.description && (
                    <Text
                      style={[
                        styles.smallDesc,
                        { marginLeft: 4, color: theme.secondary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.description}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={[styles.smallBtn, { backgroundColor: theme.primary }]}
                    onPress={() =>
                      router.push({
                        pathname: "/(institute)/skillDetails",
                        params: { skill: JSON.stringify(item) },
                      })
                    }
                  >
                    <Text
                      style={[styles.smallBtnText, { color: theme.headerText }]}
                    >
                      View
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f9",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    gap: 8,
  },
  stateText: {
    fontSize: 14,
  },
  retryBtn: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#e7f1ff",
  },
  retryText: { color: "#007bff", fontWeight: "600" },
  courseActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  readMoreRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  actionText: {
    marginLeft: 5,
    fontWeight: "600",
    fontSize: 14,
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
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  readMoreText: {
    color: "#007bff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  sectionLink: { color: "#0d6efd", fontWeight: "600" },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // Small horizontal cards
  smallCard: {
    width: 240,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  smallTitle: { fontSize: 16, fontWeight: "700" },
  smallDesc: { fontSize: 12, color: "#555", marginTop: 6 },
  smallBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#0d6efd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
  },
  smallBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },

  // Grid mini card (2-column)
  miniCard: {
    flexBasis: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
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
    padding: 14,
    marginBottom: 12,
    width: "48%",
    minHeight: 190,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    backgroundColor: "#fff",
  },

  courseName: {
    fontSize: 20,
    fontWeight: "700",
    paddingBottom: 2,
  },
  courseDescription: {
    fontSize: 13,
    marginTop: 6,
    color: "#555",
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
  headerContainer: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  headerHero: {
    backgroundColor: "#0d6efd",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    overflow: "hidden",
    marginBottom: 16,
  },
  shapeOne: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -40,
    right: -40,
  },
  shapeTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -110,
    left: -60,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 14,
  },
  programCard: { padding: 16 },
  programRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  programLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  programValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#f1f7ff",
  },
  badgeText: {
    fontSize: 12,
    color: "#0a58ca",
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#f8f9fa",
  },
  statText: {
    fontSize: 12,
    color: "#333",
  },
});
