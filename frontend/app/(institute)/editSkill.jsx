import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";

export default function EditSkill({ route, navigation }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const parsedFromRouter = params?.skill
    ? (() => {
        try {
          return JSON.parse(params.skill);
        } catch (_) {
          return null;
        }
      })()
    : null;
  const skill = route?.params?.skill || parsedFromRouter; // support both navigation methods
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;

  const [skillName, setSkillName] = useState(skill?.skillName || "");
  const [description, setDescription] = useState(skill?.description || "");
  const [category, setCategory] = useState(skill?.category || "");
  const [difficulty, setDifficulty] = useState(skill?.difficulty || "");
  const [duration, setDuration] = useState(skill?.duration || "");
  const [prerequisites, setPrerequisites] = useState(skill?.prerequisites || []);
  const [learningOutcomes, setLearningOutcomes] = useState(skill?.learningOutcomes || []);
  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [outcomeInput, setOutcomeInput] = useState("");
  const [loading, setLoading] = useState(false);

  const difficultyOptions = ["Beginner", "Intermediate", "Advanced"];
  const categoryOptions = ["Programming", "Design", "Marketing", "Business", "Language", "Technical", "Other"];

  // Add a prerequisite
  const addPrerequisite = () => {
    if (prerequisiteInput.trim() !== "") {
      setPrerequisites([...prerequisites, prerequisiteInput.trim()]);
      setPrerequisiteInput("");
    }
  };

  // Remove a prerequisite
  const removePrerequisite = (index) => {
    const newPrerequisites = [...prerequisites];
    newPrerequisites.splice(index, 1);
    setPrerequisites(newPrerequisites);
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
    const skillId = skill?.id || skill?._id; // Use id field from backend
    if (!skill || !skillId) {
      alert("Missing skill context. Please go back and open Edit again.");
      return;
    }

    if (!skillName || !description || !category || !difficulty || !duration) {
      alert("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const session = await getSession();
      const token = session?.idToken;
 
      const response = await fetch(
        `http://192.168.1.3:5000/skills/update/${skillId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({
            skillName,
            description,
            category,
            difficulty,
            duration,
            prerequisites: Array.isArray(prerequisites) ? prerequisites : [],
            learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : [],
          }),
        }
      );

      let data = {};
      try { data = await response.json(); } catch (_) {}

      if (!response.ok) {
        throw new Error(data?.message || `Failed to update skill (status ${response.status})`);
      }

      alert("Skill updated successfully!");
      if (router?.replace) {
        router.replace("/(institute)/skills");
      } else if (navigation?.navigate) {
        navigation.navigate("skills");
      }
    } catch (error) {
      alert(error?.message || "Failed to update skill");
    } finally {
      setLoading(false);
    }
  };

  const renderPrerequisite = ({ item, index }) => (
    <View style={[styles.listItem,{borderColor: theme.border, backgroundColor: theme.card}]}>
      <Text style={{ color: theme.text, flex: 1 }}>{item}</Text>
      <TouchableOpacity onPress={() => removePrerequisite(index)}>
        <Ionicons name="trash-outline" size={20} color="#ff4d4f" />
      </TouchableOpacity>
    </View>
  );

  const renderLearningOutcome = ({ item, index }) => (
    <View style={[styles.listItem,{borderColor: theme.border, backgroundColor: theme.card}]}>
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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
      <Text style={[styles.title, { color: theme.text }]}>Edit Skill</Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        placeholder="Skill Name"
        placeholderTextColor={theme.placeholder}
        value={skillName}
        onChangeText={setSkillName}
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
        placeholder="Duration (e.g. 4 weeks, 2 months)"
        placeholderTextColor={theme.placeholder}
        value={duration}
        onChangeText={setDuration}
      />

      {/* Prerequisites Input */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Prerequisites</Text>
        <View style={{ flexDirection: "row", marginBottom: 10 }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1, color: theme.text, borderColor: theme.border, backgroundColor: theme.card, marginRight: 8 },
            ]}
            placeholder="Add Prerequisite"
            placeholderTextColor={theme.text}
            value={prerequisiteInput}
            onChangeText={setPrerequisiteInput}
          />
          <TouchableOpacity style={styles.addBtn} onPress={addPrerequisite}>
            <Ionicons name="add-outline" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={prerequisites}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderPrerequisite}
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
              { flex: 1, color: theme.text, borderColor: theme.border,backgroundColor: theme.card, marginRight: 8 },
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
        <Text style={styles.submitText}>{loading ? "Saving..." : "Save Changes"}</Text>
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingBottom: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
