import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, TextInput, RefreshControl, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession, clearSession } from '../../lib/session'
import { router } from 'expo-router'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function StudentProfile() {
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const styles = useMemo(() => createStyles(theme), [theme])
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState('')
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ fullName: '', email: '', avatarUrl: '', bio: '', expertise: '' })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const initials = useMemo(
    () =>
      (profile?.fullName || user?.fullName || '')
        .split(' ')
        .map((n) => n?.[0] || '')
        .slice(0, 2)
        .join('')
        .toUpperCase(),
    [profile?.fullName, user?.fullName]
  )

  const authHeaders = useCallback((token) => (token ? { Authorization: `Bearer ${token}` } : {}), [])

  const loadProfile = useCallback(
    async (uid, tokenOverride) => {
      if (!uid) {
        return
      }
      try {
        setLoading(true)
        setError('')
        setSuccess('')
        const tokenToUse = tokenOverride || idToken
        const response = await axios.get(`${API_BASE}/api/mentor/${uid}/profile`, { headers: authHeaders(tokenToUse) })
        const payload = response?.data?.profile || null
        setProfile(payload)
        setForm({
          fullName: payload?.fullName || '',
          email: payload?.email || '',
          avatarUrl: payload?.avatarUrl || '',
          bio: payload?.bio || '',
          expertise: Array.isArray(payload?.expertise) ? payload.expertise.join(', ') : '',
        })
      } catch (e) {
        setError(e?.response?.data?.message || e.message)
      } finally {
        setLoading(false)
      }
    },
    [authHeaders, idToken]
  )

  useEffect(() => {
    (async () => {
      const session = await getSession()
      setUser(session)
      const token = session?.idToken || ''
      setIdToken(token)
      if (session?.uid) {
        loadProfile(session.uid, token)
      }
    })()
  }, [loadProfile])

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return
    setRefreshing(true)
    await loadProfile(user.uid, idToken)
    setRefreshing(false)
  }, [idToken, loadProfile, user?.uid])

  const onLogout = async () => {
    await clearSession()
    router.replace('/login')
  }

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = useCallback(async () => {
    if (!user?.uid) {
      return
    }
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      const expertiseArray = form.expertise
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
      const body = {
        fullName: form.fullName.trim() || null,
        email: form.email.trim() || null,
        avatarUrl: form.avatarUrl.trim() || null,
        bio: form.bio.trim() || null,
        expertise: expertiseArray,
      }
      const token = idToken || (await getSession())?.idToken || ''
      const response = await axios.put(`${API_BASE}/api/mentor/${user.uid}/profile`, body, { headers: authHeaders(token) })
      const nextProfile = response?.data?.profile || body
      setProfile(nextProfile)
      setForm({
        fullName: nextProfile?.fullName || '',
        email: nextProfile?.email || '',
        avatarUrl: nextProfile?.avatarUrl || '',
        bio: nextProfile?.bio || '',
        expertise: Array.isArray(nextProfile?.expertise) ? nextProfile.expertise.join(', ') : '',
      })
      setSuccess('Profile updated')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }, [authHeaders, form.avatarUrl, form.bio, form.email, form.expertise, form.fullName, idToken, user?.uid])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.headerTopRow}>
          <Text style={styles.heroTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerActionBtn} onPress={onLogout} activeOpacity={0.85}>
            <Text style={styles.headerActionText}>Logout</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroSub}>Your account information</Text>
      </LinearGradient>

      <View style={[styles.card, styles.cardGlass]}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'U'}</Text></View>
          <View style={{ flex: 1 }} />
        </View>
        <Text style={styles.cardTitle}>Details</Text>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
        ) : (
          <View style={{ gap: 12 }}>
            <Text style={styles.meta}>Name: {profile?.fullName || user?.fullName || 'Unknown'}</Text>
            <Text style={styles.meta}>Email: {profile?.email || user?.email || 'Unknown'}</Text>
            <Text style={styles.meta}>Role: {profile?.role || user?.role || 'mentor'}</Text>
            <Text style={styles.meta}>Joined: {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Recently'}</Text>
            <Text style={styles.meta}>Expertise: {Array.isArray(profile?.expertise) && profile.expertise.length ? profile.expertise.join(', ') : 'Not set'}</Text>
          </View>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.cardTitle}>Edit Profile</Text>
        <TextInput
          placeholder="Full name"
          value={form.fullName}
          onChangeText={(value) => handleChange('fullName', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Email"
          value={form.email}
          onChangeText={(value) => handleChange('email', value)}
          style={styles.input}
          keyboardType="email-address"
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Avatar URL"
          value={form.avatarUrl}
          onChangeText={(value) => handleChange('avatarUrl', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Bio"
          value={form.bio}
          onChangeText={(value) => handleChange('bio', value)}
          style={[styles.input, styles.textArea]}
          placeholderTextColor={theme.textSecondary}
          multiline
        />
        <TextInput
          placeholder="Expertise (comma separated)"
          value={form.expertise}
          onChangeText={(value) => handleChange('expertise', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TouchableOpacity style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Profile'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, styles.logoutBtn]} onPress={onLogout}>
        <Text style={styles.primaryBtnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { padding: 20, gap: 18, backgroundColor: theme.background },
    hero: { position: 'relative', padding: 24, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
    heroGlow: { position: 'absolute', bottom: -110, right: -90, width: 240, height: 240, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 9999 },
    heroTitle: { fontSize: 26, fontWeight: '700', color: theme.headerText },
    heroSub: { marginTop: 6, fontSize: 14, color: theme.headerText, opacity: 0.88 },
    headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerActionBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.18)' },
    headerActionText: { color: theme.headerText, fontWeight: '700' },
    card: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 22, padding: 20, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    cardGlass: { backgroundColor: theme.surface },
    cardAccent: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 22, padding: 20, gap: 12, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 10, color: theme.text },
    meta: { color: theme.textSecondary },
    avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.primary },
    avatarText: { color: theme.primary, fontWeight: '700', fontSize: 20 },
    primaryBtn: { marginTop: 8, paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: theme.primary },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
    logoutBtn: { backgroundColor: theme.toastError },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.text, backgroundColor: theme.card },
    textArea: { height: 96, textAlignVertical: 'top' },
    error: { color: theme.toastError, marginTop: 8 },
    success: { color: theme.accent, marginTop: 4 },
  })


