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
import { useRouter, useLocalSearchParams } from "expo-router";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";
import { API_BASE as ENV_API_BASE } from "@env";

export default function EditCourse({ route, navigation }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsedFromRouter = params?.course
    ? (() => {
        try {
          return JSON.parse(params.course);
        } catch (_) {
          return null;
        }
      })()
    : null;
  const course = route?.params?.course || parsedFromRouter; // support both navigation methods
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;

  const [courseName, setCourseName] = useState(course?.courseName || "");
  const [description, setDescription] = useState(course?.description || "");
  const [category, setCategory] = useState(course?.category || "");
  const [difficulty, setDifficulty] = useState(course?.difficulty || "");
  const [duration, setDuration] = useState(course?.duration || "");
  const [chapters, setChapters] = useState(course?.chapters || []);
  const [chapterInput, setChapterInput] = useState("");
  const [fees, setFees] = useState(course?.fees || "");
  const [learningOutcomes, setLearningOutcomes] = useState(course?.learningOutcomes || []);
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

  useEffect(() => {
    setCourseName(course?.courseName || "");
    setDescription(course?.description || "");
    setCategory(course?.category || "");
    setDifficulty(course?.difficulty || "");
    setDuration(course?.duration || "");
    setChapters(Array.isArray(course?.chapters) ? course.chapters : []);
    setFees(course?.fees !== undefined && course?.fees !== null ? String(course.fees) : "");
    setLearningOutcomes(Array.isArray(course?.learningOutcomes) ? course.learningOutcomes : []);
    setChapterInput("");
    setOutcomeInput("");
  }, [params?.course]);

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
    const courseId = course?.id || course?._id; // Use id field from backend
    if (!course || !courseId) {
      alert("Missing course context. Please go back and open Edit again.");
      return;
    }

    if (!courseName || !description || !category || !difficulty || !duration || fees === "") {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const token = session?.idToken;
 
      const response = await fetch(
        `${ENV_API_BASE}/courses/update/${courseId}`,
        {
          method: "PUT",
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
        }
      );

      let data = {};
      try { data = await response.json(); } catch (_) {}

      if (!response.ok) {
        throw new Error(data?.message || `Failed to update course (status ${response.status})`);
      }

      alert("Course updated successfully!");
      if (router?.replace) {
        router.replace("/(institute)/courses");
      } else if (navigation?.navigate) {
        navigation.navigate("courses");
      }
    } catch (error) {
      alert(error?.message || "Failed to update course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={[styles.title, { color: theme.text }]}>Edit Course</Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Course Name"
        placeholderTextColor={theme.placeholder}
        value={courseName}
        onChangeText={setCourseName}
      />

      <TextInput
        style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Description"
        placeholderTextColor={theme.placeholder}
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
        placeholder="Duration (e.g. 6 weeks)"
        placeholderTextColor={theme.placeholder}
        value={duration}
        onChangeText={setDuration}
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
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
            { flex: 1, color: theme.text, borderColor: theme.border, backgroundColor: theme.card, marginRight: 8 },
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

      {/* Display Chapters */}
      <View>
        {chapters.map((item, index) => (
          <View key={`${index}`} style={[styles.chapterItem,{borderColor: theme.border, backgroundColor: theme.card}]}>
            <Text style={{ color: theme.text}}>{item}</Text>
            <TouchableOpacity onPress={() => removeChapter(index)}>
              <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Learning Outcomes Input */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Learning Outcomes</Text>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: theme.text, borderColor: theme.border, backgroundColor: theme.card, marginRight: 8 },
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

        <View>
          {learningOutcomes.map((item, index) => (
            <View key={`${index}`} style={[styles.chapterItem,{borderColor: theme.border, backgroundColor: theme.card}]}>
              <Text style={{ color: theme.text, flex: 1 }}>{item}</Text>
              <TouchableOpacity onPress={() => removeLearningOutcome(index)}>
                <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

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
  container: { flex: 1, padding: 20 },
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
  addBtn: {
    justifyContent: "center",
    alignItems: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e0f0ff",
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
    paddingBottom: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

