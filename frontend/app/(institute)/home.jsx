import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, useColorScheme } from "react-native";
import { themes } from '../../constants/colors'
import { getSession } from "../../lib/session";

export default function InstituteHome() {
  const [user, setUser] = useState(null);
    const scheme = useColorScheme()
    const theme = scheme === 'dark' ? themes.dark : themes.light

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);
    })();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Institute Dashboard</Text>

      {user ? (
        <Text style={styles.welcomeText}>Welcome, {user.fullName}</Text>
      ) : null}

      

      {/* Program Overview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Program Overview</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Total Courses:</Text>
          <Text style={styles.value}>8</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Active Enrollments:</Text>
          <Text style={styles.value}>152</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Ongoing Batches:</Text>
          <Text style={styles.value}>5</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <Text style={styles.action}>➕ Add New Course</Text>
        <Text style={styles.action}>👥 Manage Students</Text>
        <Text style={styles.action}>📊 View Reports & Analytics</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#222",
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#444",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#555",
    maxWidth: "60%",
    textAlign: "right",
  },
  action: {
    fontSize: 14,
    paddingVertical: 5,
    color: "#007bff",
  },
});
