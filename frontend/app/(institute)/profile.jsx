import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
  Image,
  Share,
  Linking,
  Alert,
} from "react-native";
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [appTheme, setAppTheme] = useState(null);
  const effectiveThemeName = appTheme || (scheme === 'dark' ? 'dark' : 'light');
  const theme = effectiveThemeName === 'dark' ? themes.dark : themes.light;
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({ personal: true, security: false, support: false, language: false });

  useEffect(() => {
    (async () => {
      const s = await getSession();
      setUser(s);
      try {
        const pref = await AsyncStorage.getItem('skillbridge.theme.v1');
        if (pref === 'light' || pref === 'dark') setAppTheme(pref);
      } catch {}
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
    Alert.alert(
      "Log out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", style: "destructive", onPress: async () => {
          await clearSession();
          router.replace("/login");
        }}
      ]
    );
  };

  const onEditProfile = () => {
    router.push("/(institute)/editProfile");
  };

  const toggle = (key) => setExpanded((e) => ({ ...e, [key]: !e[key] }));

  const onShareApp = async () => {
    try {
      await Share.share({
        message: "Check out SkillBridge!",
        url: "https://skillbridge.example.com",
        title: "SkillBridge",
      });
    } catch {}
  };

  const onContactSupport = () => {
    Linking.openURL("mailto:kasunsanjeewa200@gmail.com");
  };

  const toggleAppearance = async () => {
    try {
      const next = effectiveThemeName === 'dark' ? 'light' : 'dark';
      setAppTheme(next);
      await AsyncStorage.setItem('skillbridge.theme.v1', next);
      DeviceEventEmitter.emit('skillbridge.theme.changed');
    } catch {}
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.shapeOne} />
        <View style={styles.shapeTwo} />
        <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.avatarText}>{(profile?.name || user?.fullName || "").slice(0,1).toUpperCase() || "I"}</Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.headerName, { color: theme.headerText }]}>{profile?.name || user?.fullName || "Loading..."}</Text>
          <Text style={[styles.username, { color: theme.headerText }]}>@{(profile?.email || user?.email || "institute").split("@")[0]}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {!loading && (
        <>
        <View style={[styles.card, { backgroundColor: theme.card }]}> 
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name={effectiveThemeName === 'dark' ? 'moon' : 'sunny-outline'} size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
            </View>
            <TouchableOpacity onPress={toggleAppearance} style={[styles.toggleBtn, { borderColor: theme.border }]}> 
              <Text style={[styles.toggleBtnText, { color: theme.text }]}>{effectiveThemeName === 'dark' ? 'Light Mode' : 'Dark Mode'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={[styles.card, { backgroundColor: theme.card }]}> 
          <View style={styles.sectionHeader}>
            <TouchableOpacity style={styles.sectionTitleRow} onPress={() => toggle('personal')}>
              <Ionicons name="person-outline" size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal information</Text>
            </TouchableOpacity>
            <View style={styles.headerRightRow}>
              <TouchableOpacity onPress={() => toggle('personal')}>
                <Ionicons name={expanded.personal ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
          {expanded.personal && (
            <View style={styles.sectionBody}>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Name</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{profile?.name || user?.fullName || "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{profile?.email || user?.email || "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{profile?.phone || "+94-123 456 7890"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Address</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>{profile?.address || "119 North Kandy"}</Text>
              </View>
              
            </View>
          )}
          <View style={styles.divider} />
          <View style={{ alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={onEditProfile} style={[styles.editPill, { backgroundColor: theme.primary, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="create-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.editPillText}>Edit</Text>
                </TouchableOpacity>
              </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('security')}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Login and security</Text>
            </View>
            <Ionicons name={expanded.security ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {expanded.security && (
            <View style={styles.sectionBody}>
              <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Password</Text><Text style={[styles.infoValue, { color: theme.text }]}>Last changed 3 months ago</Text></View>
              <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecondary }]}>2FA</Text><Text style={[styles.infoValue, { color: theme.text }]}>Disabled</Text></View>
              <View style={styles.divider} />
            </View>
            
          )}
          
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('support')}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="help-circle-outline" size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Support</Text>
            </View>
            <Ionicons name={expanded.support ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {expanded.support && (
            <View style={styles.sectionBody}>
              <TouchableOpacity onPress={onContactSupport} style={styles.listRow}> 
                <Text style={[styles.infoValue, { color: theme.text }]}>Email support</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
          
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggle('language')}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="language-outline" size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Language</Text>
            </View>
            <Ionicons name={expanded.language ? "chevron-up" : "chevron-down"} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {expanded.language && (
            <View style={styles.sectionBody}>
              <View style={styles.infoRow}><Text style={[styles.infoLabel, { color: theme.textSecondary }]}>App language</Text><Text style={[styles.infoValue, { color: theme.text }]}>English</Text></View>
              <View style={styles.divider} />
            </View>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={onShareApp}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="share-social-outline" size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Share the app</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          
        </View>

        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <TouchableOpacity style={styles.sectionHeader} onPress={onLogout}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="power-outline" size={18} color={theme.text} style={styles.sectionIcon} />
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Log Out</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
        </>
      )}

      {/* Action Buttons removed: now handled inline in sections */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
  headerName: {
    fontSize: 22,
    fontWeight: "700",
  },
  headerRole: {
    fontSize: 16,
    color: "#fff",
    marginTop: 4,
  },
  username: { fontSize: 14, marginTop: 4 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  shapeOne: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -30,
    right: -30,
  },
  shapeTwo: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -100,
    left: -60,
  },
  card: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 0,
    borderWidth: 1,
    borderColor: "#00000010",
    marginBottom: 10,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  sectionBody: { marginTop: 8, paddingBottom: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingVertical: 6, minHeight: 24 },
  infoLabel: { fontSize: 14 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#00000012', marginVertical: 12, marginHorizontal: 8, borderRadius: 999 },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  editPill: { paddingHorizontal: 12, paddingVertical: 6, paddingTop: 6, paddingBottom: 6, borderRadius: 16, width: '30%' },
  editPillText: { color: '#fff', fontWeight: '800', fontSize: 20 },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  toggleBtnText: { fontSize: 12, fontWeight: '700' },
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
