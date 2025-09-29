import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";

export default function EditCourse({ route, navigation }) {
  const { course } = route.params; // course object passed from course list
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;

  const [courseName, setCourseName] = useState(course.courseName);
  const [description, setDescription] = useState(course.description);
  const [duration, setDuration] = useState(course.duration);
  const [chapters, setChapters] = useState(course.chapters || []);
  const [chapterInput, setChapterInput] = useState("");
  const [fees, setFees] = useState(course.fees);
  const [loading, setLoading] = useState(false);

  // Add a chapter
  const addChapter = () => {
    if (chapterInput.trim() !== "") {
      setChapters([...chapters, chapterInput.trim()]);
      setChapterInput("");
    }
  };

  // Remove a chapter
  const removeChapter = (index) => {
    const newChapters = [...chapters];
    newChapters.splice(index, 1);
    setChapters(newChapters);
  };

  // Handle save
  const handleSave = async () => {
    if (!courseName || !description || !duration || !fees) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const token = session?.idToken;

      const response = await fetch(
        `http://192.168.1.4:5000/courses/update/${course._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            courseName,
            description,
            duration,
            fees,
            chapters,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update course");
      }

      alert("Course updated successfully!");
      navigation.goBack();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Edit Course</Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Course Name"
        placeholderTextColor={theme.placeholder}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
        style={[styles.textarea, { color: theme.text, borderColor: theme.border }]}
        placeholder="Description"
        placeholderTextColor={theme.placeholder}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Duration (e.g. 6 weeks)"
        placeholderTextColor={theme.placeholder}
        value={duration}
        onChangeText={setDuration}
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Course Fees"
        placeholderTextColor={theme.placeholder}
        value={fees}
        onChangeText={setFees}
        keyboardType="numeric"
      />

      {/* Chapters Input */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <TextInput
          style={[
            styles.input,
            { flex: 1, color: theme.text, borderColor: theme.border, marginRight: 8 },
          ]}
          placeholder="Add Chapter"
          placeholderTextColor={theme.placeholder}
          value={chapterInput}
          onChangeText={setChapterInput}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addChapter}>
          <Ionicons name="add-outline" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Display Chapters */}
      <FlatList
        data={chapters}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.chapterItem}>
            <Text style={{ color: theme.text }}>{item}</Text>
            <TouchableOpacity onPress={() => removeChapter(index)}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.submitBtn, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? "Saving..." : "Save Changes"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 120,
    maxHeight: 200,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    borderColor: "#ccc",
  },
  addBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f0ff",
  },
  chapterItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  submitBtn: {
    backgroundColor: "#28a745",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

