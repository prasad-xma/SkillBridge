import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  useColorScheme,
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";

export default function AddCourse() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;

  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [chapters, setChapters] = useState([]);
  const [fees, setFees] = useState("");
  const [loading, setLoading] = useState(false);

  // Add chapter to the list
  const addChapter = () => {
    if (chapterInput.trim() === "") return;
    setChapters((prev) => [...prev, chapterInput.trim()]);
    setChapterInput("");
  };

  // Remove a chapter
  const removeChapter = (index) => {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form to backend
  const handleSubmit = async () => {
    try {
      if (
        !courseName ||
        !description ||
        !duration ||
        chapters.length === 0 ||
        !fees
      ) {
        alert("Please fill in all fields and add at least one chapter");
        return;
      }

      setLoading(true);

      const body = {
        courseName,
        description,
        duration,
        chapters, // send as array
        fees,
      };

      const session = await getSession();
      const token = session?.idToken;

      const response = await fetch("http://192.168.1.4:5000/courses/add", {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add course");
      }

      alert("Course added successfully!");
      setCourseName("");
      setDescription("");
      setDuration("");
      setChapters([]);
      setFees("");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Add course Dashboard
      </Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Course Name"
        placeholderTextColor={theme.placeholder}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
  style={[
    styles.textarea,
    { color: theme.text, borderColor: theme.border },
  ]}
  placeholder="Description"
  placeholderTextColor={theme.placeholder}
  value={description}
  onChangeText={setDescription}
  multiline
  textAlignVertical="top" // ensures text starts from the top
  numberOfLines={5}       // sets default visible lines
/>


      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Duration (e.g. 6 weeks)"
        placeholderTextColor={theme.placeholder}
        value={duration}
        onChangeText={setDuration}
      />

      {/* Chapters input with + button */}
      <View style={{ flexDirection: "row", marginBottom: 10 }}>
        <TextInput
          style={[
            styles.input,
            {
              flex: 1,
              color: theme.text,
              borderColor: theme.border,
              marginRight: 8,
            },
          ]}
          placeholder="Add Chapter"
          placeholderTextColor={theme.placeholder}
          value={chapterInput}
          onChangeText={setChapterInput}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addChapter}>
          <Ionicons name="add-circle-sharp" size={40} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* Display list of chapters */}
      <FlatList
        data={chapters}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.chapterItem}>
            <Text style={{ color: theme.text, flex: 1 }}>{item}</Text>
            <TouchableOpacity onPress={() => removeChapter(index)}>
              <Ionicons name="trash-sharp" size={18} color="red" />
            </TouchableOpacity>
          </View>
        )}
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Course Fees"
        placeholderTextColor={theme.placeholder}
        value={fees}
        onChangeText={setFees}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={[styles.submitBtn, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.submitText}>
          {loading ? "Saving..." : "Save Course"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9f9f9",
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
    color: "#222",
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },

  textarea: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 120,
    maxHeight: 200,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    textAlignVertical: "top",
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
    backgroundColor: "#ffffffff",
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

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

