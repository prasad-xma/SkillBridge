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
import { themes } from "../../constants/colors";

export default function SkillDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const deviceWidth = Dimensions.get("window").width;

  // Parse skill data from params
  const skill = params?.skill
    ? (() => {
        try {
          return JSON.parse(params.skill);
        } catch (_) {
          return null;
        }
      })()
    : null;

  const [loading, setLoading] = useState(false);

  if (!skill) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ff4d4f" />
          <Text style={[styles.errorText, { color: theme.text }]}>
            Skill not found
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
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
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
        return 'trophy';
    }
  };

  const renderPrerequisite = ({ item, index }) => (
    <View style={[styles.listItem, { backgroundColor: theme.card }]}>
      <View style={styles.listNumber}>
        <Text style={[styles.listNumberText, { color: theme.primary }]}>
          {index + 1}
        </Text>
      </View>
      <Text style={[styles.listText, { color: theme.text }]}>{item}</Text>
    </View>
  );

  const renderLearningOutcome = ({ item, index }) => (
    <View style={[styles.listItem, { backgroundColor: theme.card }]}>
      <View style={styles.listNumber}>
        <Text style={[styles.listNumberText, { color: theme.primary }]}>
          {index + 1}
        </Text>
      </View>
      <Text style={[styles.listText, { color: theme.text }]}>{item}</Text>
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
          Skill Details
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Skill Thumbnail */}
      {skill.thumbnailUrl && (
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: skill.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Skill Information */}
      <View style={[styles.contentContainer, { backgroundColor: theme.card }]}>
        <View style={styles.skillHeader}>
          <View style={styles.skillTitleContainer}>
            <Ionicons
              name={getCategoryIcon(skill.category)}
              size={28}
              color={theme.primary}
              style={{ marginRight: 12 }}
            />
            <Text style={[styles.skillName, { color: theme.text }]}>
              {skill.skillName}
            </Text>
          </View>
          <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(skill.difficulty) }]}>
            <Text style={styles.difficultyText}>{skill.difficulty}</Text>
          </View>
        </View>

        <Text style={[styles.description, { color: theme.textSecondary }]}>
          {skill.description}
        </Text>

        {/* Skill Stats */}
        <View style={[styles.statsContainer, { backgroundColor: theme.card }]}>
          <View style={styles.statItem}>
            <Ionicons name="folder-outline" size={20} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Category
            </Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              {skill.category}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Duration
            </Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              {skill.duration}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={theme.primary} />
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Outcomes
            </Text>
            <Text style={[styles.statValue, { color: theme.textSecondary }]}>
              {skill.learningOutcomes?.length || 0}
            </Text>
          </View>
        </View>

        {/* Skill Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
              Created
            </Text>
            <Text style={[styles.metadataValue, { color: theme.text }]}>
              {formatDate(skill.createdAt)}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>
              Last Updated
            </Text>
            <Text style={[styles.metadataValue, { color: theme.text }]}>
              {formatDate(skill.updatedAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Prerequisites */}
      {skill.prerequisites && skill.prerequisites.length > 0 && (
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Prerequisites
          </Text>
          <FlatList
            data={skill.prerequisites}
            renderItem={renderPrerequisite}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Learning Outcomes */}
      {skill.learningOutcomes && skill.learningOutcomes.length > 0 && (
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Learning Outcomes
          </Text>
          <FlatList
            data={skill.learningOutcomes}
            renderItem={renderLearningOutcome}
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
              pathname: "/(institute)/editSkill",
              params: { skill: JSON.stringify(skill) },
            });
          }}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Edit Skill</Text>
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
  skillHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  skillTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  skillName: {
    fontSize: 24,
    fontWeight: "700",
    flex: 1,
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
  sectionContainer: {
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  listNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e3f2fd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  listNumberText: {
    fontSize: 14,
    fontWeight: "700",
  },
  listText: {
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
