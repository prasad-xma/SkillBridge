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
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";
import { useRouter } from "expo-router";
import { API_BASE as ENV_API_BASE } from "@env";

export default function AddCourse() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;

  const [courseName, setCourseName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState("");
  const [fees, setFees] = useState("");
  const [chapterInput, setChapterInput] = useState("");
  const [chapters, setChapters] = useState([]);
  const [learningOutcomes, setLearningOutcomes] = useState([]);
  const [outcomeInput, setOutcomeInput] = useState("");
  const [loading, setLoading] = useState(false);

  const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];
  const categoryOptions = ["Programming", "Design", "Marketing", "Business", "Language", "Technical", "Web Development", "Data Science", "Other"];

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

  // Add a learning outcome
  const addLearningOutcome = () => {
    if (outcomeInput.trim() !== "") {
      setLearningOutcomes([...learningOutcomes, outcomeInput.trim()]);
      setOutcomeInput("");
    }
  };

  // Remove a learning outcome
  const removeLearningOutcome = (index) => {
    const newOutcomes = [...learningOutcomes];
    newOutcomes.splice(index, 1);
    setLearningOutcomes(newOutcomes);
  };

  // Handle save
  const handleSave = async () => {
    if (!courseName || !description || !category || !difficulty || !duration || !fees) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const token = session?.idToken;

      const response = await fetch(`${ENV_API_BASE}/courses/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          courseName,
          description,
          category,
          difficulty,
          duration,
          fees: Number(fees),
          chapters: Array.isArray(chapters) ? chapters : [],
          learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
        }),
      });

      let data = {};
      try { data = await response.json(); } catch (_) {}

      if (!response.ok) {
        throw new Error(data?.message || `Failed to add course (status ${response.status})`);
      }

      alert("Course added successfully!");
      router.back();
    } catch (error) {
      alert(error?.message || "Failed to add course");
    } finally {
      setLoading(false);
    }
  };

  const renderChapter = ({ item, index }) => (
    <View style={styles.listItem}>
      <Text style={{ color: theme.text, flex: 1 }}>{item}</Text>
      <TouchableOpacity onPress={() => removeChapter(index)}>
        <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
      </TouchableOpacity>
    </View>
  );

  const renderLearningOutcome = ({ item, index }) => (
    <View style={styles.listItem}>
      <Text style={{ color: theme.text, flex: 1 }}>{item}</Text>
      <TouchableOpacity onPress={() => removeLearningOutcome(index)}>
        <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={{ paddingBottom: 30 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
      <Text style={[styles.title, { color: theme.text }]}>Add New Course</Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Course Name"
        placeholderTextColor={theme.text}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
        style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Description"
        placeholderTextColor={theme.text}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* Category Selection */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Category</Text>
        <View style={styles.optionsContainer}>
          {categoryOptions.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.optionButton,
                { backgroundColor: category === cat ? theme.primary : theme.card },
                { borderColor: theme.border }
              ]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[
                styles.optionText,
                { color: category === cat ? "#fff" : theme.text }
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Difficulty Selection */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Difficulty Level</Text>
        <View style={styles.optionsContainer}>
          {difficultyOptions.map((diff) => (
            <TouchableOpacity
              key={diff}
              style={[
                styles.optionButton,
                { backgroundColor: difficulty === diff ? theme.primary : theme.card },
                { borderColor: theme.border }
              ]}
              onPress={() => setDifficulty(diff)}
            >
              <Text style={[
                styles.optionText,
                { color: difficulty === diff ? "#fff" : theme.text }
              ]}>
                {diff}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Duration (e.g. 6 weeks, 3 months)"
        placeholderTextColor={theme.text}
        value={duration}
        onChangeText={setDuration}
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Course Fees"
        placeholderTextColor={theme.text}
        value={fees}
        onChangeText={setFees}
        keyboardType="numeric"
      />

      {/* Chapters Input */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Course Chapters</Text>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: theme.text, borderColor: theme.border, marginRight: 8 },
            ]}
            placeholder="Add Chapter"
            placeholderTextColor={theme.text}
            value={chapterInput}
            onChangeText={setChapterInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addChapter}>
            <Ionicons name="add-outline" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={chapters}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderChapter}
          scrollEnabled={false}
        />
      </View>

      {/* Learning Outcomes Input */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Learning Outcomes</Text>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: theme.text, borderColor: theme.border, marginRight: 8 },
            ]}
            placeholder="Add Learning Outcome"
            placeholderTextColor={theme.text}
            value={outcomeInput}
            onChangeText={setOutcomeInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addLearningOutcome}>
            <Ionicons name="add-outline" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={learningOutcomes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderLearningOutcome}
          scrollEnabled={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { opacity: loading ? 0.7 : 1 }]}
        onPress={handleSave}
        disabled={loading}
      >
        <Text style={styles.submitText}>{loading ? "Adding..." : "Add Course"}</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  addBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f0ff",
  },
  listItem: {
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
    marginBottom: 20,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
