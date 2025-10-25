import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { themes } from "../../constants/colors";
import { getSession, clearSession } from "../../lib/session";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { API_BASE as ENV_API_BASE } from "@env";

export default function InstituteProfile() {
  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || "http://192.168.1.4:5000";
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);
      await loadProfile();
    })();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Refetch profile when returning to this screen
      loadProfile();
      return undefined;
    }, [])
  );

  const loadProfile = async () => {
    try {
      setError(null);
      setLoading(true);
      const session = await getSession();
      const token = session?.idToken || session?.token || session?.accessToken;
      if (!token) {
        // Fallback to session data if no token available
        setProfile({
          name: session?.fullName,
          email: session?.email,
          type: session?.role,
        });
        return;
      }

      const urls = [
        `${API_BASE}/institutes/me`,
        `${API_BASE}/api/institutes/me`,
        `${API_BASE}/api/auth/me`,
      ];
      let lastErr = null;
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
          });
          let data = {};
          try { data = await res.json(); } catch {}
          if (!res.ok) throw new Error(`${data?.message || 'Request failed'} (GET ${url} -> ${res.status})`);
          setProfile(data);
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (lastErr) throw lastErr;
    } catch (e) {
      setError(e?.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    await clearSession();
    router.replace("/login");
  };

  const onEditProfile = () => {
    router.push("/(institute)/editProfile");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <Text style={styles.headerName}>{profile?.name || user?.fullName || "Loading..."}</Text>
        <Text style={styles.headerRole}>{profile?.type || user?.role || ""}</Text>
      </View>

      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {!!error && !loading && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.errorRow}>
            <Ionicons name="warning-outline" size={20} color="#ff4d4f" />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!loading && (
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Institute Name</Text>
          <Text style={[styles.value, { color: theme.text }]}>{profile?.name || user?.fullName || "-"}</Text>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
          <Text style={[styles.value, { color: theme.text }]}>{profile?.email || user?.email || "-"}</Text>

          {!!profile?.phone && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Phone</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.phone}</Text>
            </>
          )}

          {!!profile?.address && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Address</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.address}</Text>
            </>
          )}

          {!!profile?.website && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Website</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.website}</Text>
            </>
          )}

          {!!profile?.description && (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>About</Text>
              <Text style={[styles.value, { color: theme.text }]}>{profile.description}</Text>
            </>
          )}
        </View>
      )}

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
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#e7f1ff",
  },
  retryText: { color: "#0a58ca", fontWeight: "600" },
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
