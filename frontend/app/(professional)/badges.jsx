import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useColorScheme, RefreshControl, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Badges() {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState('')
  const [badges, setBadges] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const styles = useMemo(() => createStyles(theme), [theme])

  const authHeaders = useCallback((token) => (token ? { Authorization: `Bearer ${token}` } : {}), [])

  const fetchBadges = useCallback(async (uid, tokenOverride) => {
    if (!uid) {
      return
    }
    try {
      setLoading(true)
      setError('')
      const tokenToUse = tokenOverride || idToken
      console.log('[Badges] load badges', { API_BASE, uid })
      const res = await axios.get(`${API_BASE}/api/mentor/${uid}/badges`, { headers: authHeaders(tokenToUse) })
      setBadges(Array.isArray(res?.data?.badges) ? res.data.badges : [])
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to reach server')
    } finally {
      setLoading(false)
    }
  }, [authHeaders, idToken])

  useEffect(() => {
    (async () => {
      const session = await getSession()
      setUser(session)
      const token = session?.idToken || ''
      setIdToken(token)
      if (session?.uid) {
        fetchBadges(session.uid, token)
      }
    })()
  }, [fetchBadges])

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return
    setRefreshing(true)
    await fetchBadges(user.uid, idToken)
    setRefreshing(false)
  }, [fetchBadges, idToken, user?.uid])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddBadge = useCallback(async () => {
    if (!user?.uid || !form.name.trim()) {
      setError('Badge name is required')
      return
    }
    try {
      setSubmitting(true)
      setError('')
      const payload = { name: form.name.trim(), description: form.description.trim() || null }
      const token = idToken || (await getSession())?.idToken || ''
      console.log('[Badges] add badge', { API_BASE, uid: user.uid, payload })
      const res = await axios.post(`${API_BASE}/api/mentor/${user.uid}/badge`, payload, { headers: authHeaders(token) })
      setBadges(Array.isArray(res?.data?.badges) ? res.data.badges : [])
      setForm({ name: '', description: '' })
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to reach server')
    } finally {
      setSubmitting(false)
    }
  }, [authHeaders, form.description, form.name, idToken, user?.uid])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroTitle}>Badges</Text>
        <Text style={styles.heroSub}>Your achievements and milestones</Text>
      </LinearGradient>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={[styles.card, styles.cardGlass]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🏅</Text>
          <Text style={styles.cardTitle}>All Badges</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
        ) : (
          <View style={styles.grid}>
            {badges.map((b) => (
              <View key={b.id || b.name} style={styles.badge}>
                <Text style={styles.badgeTitle}>{b.name}</Text>
                {b.description ? <Text style={styles.badgeMeta}>{b.description}</Text> : null}
              </View>
            ))}
            {!badges.length ? <Text style={styles.secondaryText}>No badges yet</Text> : null}
          </View>
        )}
      </View>

      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.formTitle}>Add New Badge</Text>
        <TextInput
          placeholder="Badge name"
          value={form.name}
          onChangeText={(text) => handleChange('name', text)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Description (optional)"
          value={form.description}
          onChangeText={(text) => handleChange('description', text)}
          style={[styles.input, styles.textArea]}
          placeholderTextColor={theme.textSecondary}
          multiline
        />
        <TouchableOpacity style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]} onPress={handleAddBadge} disabled={submitting}>
          <Text style={styles.primaryBtnText}>{submitting ? 'Adding…' : 'Add Badge'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { padding: 20, gap: 18, backgroundColor: theme.background },
    hero: { position: 'relative', padding: 24, borderRadius: 24, overflow: 'hidden', marginBottom: 16 },
    heroGlow: { position: 'absolute', bottom: -110, right: -80, width: 220, height: 220, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 9999 },
    heroTitle: { fontSize: 26, fontWeight: '700', color: theme.headerText },
    heroSub: { marginTop: 6, fontSize: 14, color: theme.headerText, opacity: 0.9 },
    card: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 22, padding: 20, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    cardGlass: { backgroundColor: theme.surface },
    cardAccent: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 22, padding: 20, gap: 12, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionIcon: { fontSize: 18, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(148, 163, 184, 0.18)', color: theme.text },
    cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    badge: { width: '47%', borderRadius: 18, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 16, gap: 6 },
    badgeTitle: { fontWeight: '700', color: theme.primary },
    badgeMeta: { fontSize: 12, color: theme.textSecondary },
    secondaryText: { color: theme.textSecondary },
    formTitle: { fontSize: 18, fontWeight: '700', color: theme.primary },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.text, backgroundColor: theme.card },
    textArea: { height: 96, textAlignVertical: 'top' },
    primaryBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: theme.primary },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
    error: { color: theme.toastError, marginBottom: 8 },
  })
