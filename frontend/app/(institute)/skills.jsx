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

export default function SkillsHome() {
  const [user, setUser] = useState(null);
  const [skills, setSkills] = useState([]);
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const navigation = useNavigation();

  const deviceWidth = Dimensions.get("window").width - 30; // padding adjustment

  const loadSkills = async () => {
    try {
      const response = await fetch("http://192.168.1.4:5000/skills");
      const data = await response.json();
      if (response.ok) setSkills(data);
    } catch (error) {
      console.log("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);

      // Fetch skills from backend
      await loadSkills();
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadSkills();
      return undefined;
    }, [])
  );

  const onEditSkill = (skill) => {
    // Navigate using expo-router and pass skill via params
    try {
      router.push({
        pathname: "/(institute)/editSkill",
        params: { skill: JSON.stringify(skill) },
      });
    } catch (e) {
      // fallback to react-navigation if available
      navigation?.navigate?.("editSkill", { skill });
    }
  };

  const onReadMore = (skill) => {
    try {
      router.push({
        pathname: "/(institute)/skillDetails",
        params: { skill: JSON.stringify(skill) },
      });
    } catch (e) {
      // fallback to react-navigation if available
      navigation?.navigate?.("skillDetails", { skill });
    }
  };

  const onDeleteSkill = (skill) => {
    Alert.alert(
      "Delete Skill",
      "Are you sure you want to delete this skill?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              const session = await getSession();
              const token = session?.idToken;
              const skillId = skill.id || skill._id; // Use id field from backend
              
              const response = await fetch(
                `http://192.168.1.4:5000/skills/delete/${skillId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                  },
                }
              );

              let data = {};
              try { data = await response.json(); } catch (_) {}
              if (!response.ok) {
                throw new Error(data.message || "Failed to delete skill");
              }

              // Optimistically update local state and then refetch to reflect DB
              setSkills((prev) => prev.filter((s) => (s.id || s._id) !== skillId));
              await loadSkills();
              Alert.alert("Success", "Skill deleted successfully");
            } catch (err) {
              Alert.alert("Error", err.message || "Could not delete skill");
            }
          },
        },
      ]
    );
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

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'programming':
        return 'code-slash';
      case 'design':
        return 'brush';
      case 'marketing':
        return 'megaphone';
      case 'business':
        return 'business';
      case 'language':
        return 'language';
      case 'technical':
        return 'settings';
      default:
        return 'star';
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
      <View style={[styles.headerContainer, styles.headerHero]}>
        <View style={styles.shapeOne} />
        <View style={styles.shapeTwo} />
        {/* Header Title */}
        <Text style={[styles.headerTitle, { color: '#fff' }]}>
          Skills 
        </Text>

        {/* Welcome User */}
        {user && (
          <Text style={[styles.headerSubtitle, { color: '#eaf2ff' }]}>
            Welcome, {user.fullName}
          </Text>
        )}

        {/* Skills Overview Card */}
        <View
          style={[
            styles.programCard,
            { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 12 }
          ]}
        >
          <View style={styles.programRow}>
            <Ionicons
              name="bulb-outline"
              size={28}
              color="#ffffff"
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.programLabel, { color: '#eaf2ff' }]}
              >
                Total Skills
              </Text>
              <Text style={[styles.programValue, { color: '#fff' }]}>
                {skills.length}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Skills List */}
      {skills.map((skill) => (
        <View
          key={skill.id || skill._id}
          style={[
            styles.skillCard,
            { width: deviceWidth, backgroundColor: "#fff" },
          ]}
        >
          <View style={styles.skillHeader}>
            <View style={styles.skillTitleContainer}>
              <Ionicons
                name={getCategoryIcon(skill.category)}
                size={24}
                color="#007bff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.skillName}>{skill.skillName}</Text>
            </View>
            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(skill.difficulty) }]}>
              <Text style={styles.difficultyText}>{skill.difficulty}</Text>
            </View>
          </View>

          <Text style={styles.skillCategory}>Category: {skill.category}</Text>
          <Text style={styles.skillDuration}>Duration: {skill.duration}</Text>
          <Text style={styles.skillDescription} numberOfLines={2}>
            {skill.description}
          </Text>

          {/* Action Buttons */}
          <View style={styles.skillActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onEditSkill(skill)}
            >
              <Ionicons name="create-outline" size={20} color="#007bff" />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => onDeleteSkill(skill)}
            >
              <Ionicons name="trash-sharp" size={20} color="#ff4d4f" />
              <Text style={styles.actionText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.readMoreContainer}
              onPress={() => onReadMore(skill)}
            >
              <Text style={styles.readMoreText}>Read more</Text>
              <Ionicons
                name="arrow-forward-outline"
                size={18}
                color="#007bff"
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      </ScrollView>
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/(institute)/addSkill")}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f9",
  },
  skillActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
  skillCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    minHeight: 180,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: "#fff",
  },
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  skillTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  skillName: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  skillCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  skillDuration: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  skillDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 10,
  },
  headerContainer: {
    padding: 20,
  },
  headerHero: {
    backgroundColor: '#0d6efd',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingTop: 28,
    paddingBottom: 24,
    overflow: 'hidden',
    marginBottom: 16,
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
  programCard: {
    padding: 16,
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
});
