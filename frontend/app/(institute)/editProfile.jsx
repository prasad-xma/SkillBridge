import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { themes } from "../../constants/colors";
import { getSession } from "../../lib/session";
import Constants from "expo-constants";
import { API_BASE as ENV_API_BASE } from "@env";

export default function EditProfile() {
  const router = useRouter();
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? themes.dark : themes.light;
  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || "http://192.168.1.4:5000";

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [id, setId] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError(null);
      setLoading(true);
      const session = await getSession();
      const token = session?.idToken || session?.token || session?.accessToken;
      const urls = [
        `${API_BASE}/institutes/me`,
        `${API_BASE}/api/institutes/me`,
        `${API_BASE}/api/auth/me`,
      ];
      let data = {};
      let ok = false;
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers: { Authorization: token ? `Bearer ${token}` : "" } });
          try { data = await res.json(); } catch {}
          if (!res.ok) throw new Error(data?.message || `Failed (${res.status})`);
          ok = true;
          break;
        } catch (e) {
          data = {};
          continue;
        }
      }
      if (!ok) throw new Error("Failed to load profile");
      const _id = data?.id || data?._id || data?.userId || data?.instituteId || null;
      setId(_id);
      setName(data?.name || "");
      setEmail(data?.email || "");
      setPhone(data?.phone || "");
      setAddress(data?.address || "");
      setWebsite(data?.website || "");
      setDescription(data?.description || "");
    } catch (e) {
      setError(e?.message || "Could not load profile");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async () => {
    if (!name || !email) {
      alert("Name and Email are required");
      return;
    }

    setSaving(true);
    try {
      const session = await getSession();
      const token = session?.idToken || session?.token || session?.accessToken;
      const payload = { name, email, phone, address, website, description };
      // Try update endpoints (with and without /api). Prefer id path when available, else /me
      const putUrls = id
        ? [
            `${API_BASE}/institutes/update/${id}`,
            `${API_BASE}/api/institutes/update/${id}`,
          ]
        : [
            `${API_BASE}/institutes/me`,
            `${API_BASE}/api/institutes/me`,
          ];

      let saved = false;
      for (const url of putUrls) {
        try {
          const res = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
            },
            body: JSON.stringify(payload),
          });
          let data = {};
          try { data = await res.json(); } catch {}
          if (!res.ok) throw new Error(data?.message || `Failed (${res.status})`);
          saved = true;
          break;
        } catch (e) {
          continue;
        }
      }
      if (!saved) throw new Error("Failed to update profile");
      alert("Profile updated successfully");
      router.back();
    } catch (e) {
      alert(e?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Edit Institute Profile</Text>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
          {!!error && <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>}
        </View>
      ) : (
        <>
          {!!error && (
            <View style={[styles.errorBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="warning-outline" size={18} color="#ff4d4f" />
              <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Institute Name"
            placeholderTextColor={theme.placeholder}
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Email"
            placeholderTextColor={theme.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Phone"
            placeholderTextColor={theme.placeholder}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Address"
            placeholderTextColor={theme.placeholder}
            value={address}
            onChangeText={setAddress}
          />

          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="Website"
            placeholderTextColor={theme.placeholder}
            autoCapitalize="none"
            value={website}
            onChangeText={setWebsite}
          />

          <TextInput
            style={[styles.textarea, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            placeholder="About / Description"
            placeholderTextColor={theme.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <TouchableOpacity
            style={[styles.submitBtn, { opacity: saving ? 0.7 : 1 }]}
            onPress={onSave}
            disabled={saving}
          >
            <Text style={styles.submitText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20, textAlign: "center" },
  centerState: { alignItems: "center", justifyContent: "center", paddingVertical: 30, gap: 8 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  errorText: { fontSize: 14, flex: 1 },
  retryBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#e7f1ff" },
  retryText: { color: "#0a58ca", fontWeight: "600" },
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
    textAlignVertical: "top",
    backgroundColor: "#fff",
    borderColor: "#ccc",
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
