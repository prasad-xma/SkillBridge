import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession, clearSession } from "../../lib/session";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function InstituteProfile() {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);
    })();
  }, []);

  const onLogout = async () => {
    await clearSession();
    router.replace("/login");
  };

  const onEditProfile = () => {
    router.push("/institute/edit-profile"); // Navigate to edit profile page
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerName}>{user?.fullName || "Loading..."}</Text>
        <Text style={styles.headerRole}>{user?.role || ""}</Text>
      </View>

      {/* User Details Card */}
      <View style={[styles.card, { backgroundColor: theme.card }]}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Name</Text>
        <Text style={[styles.value, { color: theme.text }]}>
          {user?.fullName}
        </Text> 

        <Text style={[styles.label, { color: theme.textSecondary }]}>
          Email
        </Text>
        <Text style={[styles.value, { color: theme.text }]}>{user?.email}</Text>

        <Text style={[styles.label, { color: theme.textSecondary }]}>Role</Text>
        <Text style={[styles.value, { color: theme.text }]}>{user?.role}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#007bff" }]}
          onPress={onEditProfile}
        >
          <Ionicons
            name="create-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#ff4d4f" }]}
          onPress={onLogout}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  headerName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  headerRole: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  card: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
