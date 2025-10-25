import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, TextInput, RefreshControl, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Reminders() {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState('')
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ note: '', when: '' })
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const styles = useMemo(() => createStyles(theme), [theme])

  const authHeaders = useCallback((token) => (token ? { Authorization: `Bearer ${token}` } : {}), [])

  const loadReminders = useCallback(async (uid, tokenOverride) => {
    if (!uid) return
    try {
      setLoading(true)
      setError('')
      const tokenToUse = tokenOverride || idToken
      const res = await axios.get(`${API_BASE}/api/mentor/${uid}/reminders`, { headers: authHeaders(tokenToUse) })
      setReminders(Array.isArray(res?.data?.reminders) ? res.data.reminders : [])
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to reach server')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, idToken])

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
      const token = s?.idToken || ''
      setIdToken(token)
      if (s?.uid) {
        loadReminders(s.uid, token)
      }
    })()
  }, [loadReminders])

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return
    setRefreshing(true)
    await loadReminders(user.uid, idToken)
    setRefreshing(false)
  }, [idToken, loadReminders, user?.uid])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = useCallback(async () => {
    if (!user?.uid || !form.note.trim()) {
      setError('Reminder note is required')
      return
    }
    try {
      setSaving(true)
      setError('')
      const payload = {
        note: form.note.trim(),
        when: form.when ? new Date(form.when).toISOString() : null,
      }
      const token = idToken || (await getSession())?.idToken || ''
      const res = await axios.post(`${API_BASE}/api/mentor/${user.uid}/reminder`, payload, { headers: authHeaders(token) })
      setReminders(Array.isArray(res?.data?.reminders) ? res.data.reminders : [])
      setForm({ note: '', when: '' })
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }, [authHeaders, form.note, form.when, idToken, user?.uid])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.headerTopRow}>
          <Text style={styles.heroTitle}>Reminders</Text>
          <TouchableOpacity
            onPress={() => router.push('/(professional)/chat')}
            style={styles.chatIconBtn}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.headerText} />
          </TouchableOpacity>
        </View>
        <Text style={styles.heroSub}>Create quick follow-ups</Text>
      </LinearGradient>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.card, styles.cardGlass]}>
        <Text style={styles.cardTitle}>Upcoming</Text>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
        ) : (
          <>
            {reminders.length ? (
              reminders.map((item) => (
                <View key={item.id} style={styles.reminderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderNote}>{item.note}</Text>
                    <Text style={styles.meta}>{item.when ? new Date(item.when).toLocaleString() : 'No time set'}</Text>
                  </View>
                  <Text style={[styles.badge, item.completed ? styles.badgeDone : styles.badgePending]}>
                    {item.completed ? 'Done' : 'Pending'}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.meta}>No reminders added yet.</Text>
            )}
          </>
        )}
      </View>

      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.cardTitle}>Add Reminder</Text>
        <TextInput
          placeholder="Reminder note"
          value={form.note}
          onChangeText={(value) => handleChange('note', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="When (e.g. 2025-10-24 14:30)"
          value={form.when}
          onChangeText={(value) => handleChange('when', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TouchableOpacity style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Reminder'}</Text>
        </TouchableOpacity>
      </View>
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
    chatIconBtn: { padding: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
    card: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 22, padding: 20, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    cardGlass: { backgroundColor: theme.surface },
    cardAccent: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 22, padding: 20, gap: 12, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: theme.text },
    primaryBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: theme.primary },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
    meta: { color: theme.textSecondary, marginTop: 6 },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.text, backgroundColor: theme.card },
    reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    reminderNote: { fontWeight: '600', color: theme.text, marginBottom: 2 },
    badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 999, fontSize: 12, fontWeight: '700' },
    badgeDone: { backgroundColor: 'rgba(34,197,94,0.18)', color: theme.accent },
    badgePending: { backgroundColor: 'rgba(96,165,250,0.18)', color: theme.primary },
    error: { color: theme.toastError },
  })
