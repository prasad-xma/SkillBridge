import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useColorScheme, TextInput, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Progress() {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState('')
  const [progress, setProgress] = useState({ mentees: 0, active: 0, averageCompletion: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ mentees: '', active: '', completion: '' })
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const styles = useMemo(() => createStyles(theme), [theme])

  const authHeaders = useCallback((token) => (token ? { Authorization: `Bearer ${token}` } : {}), [])

  const loadProgress = useCallback(async (uid, tokenOverride) => {
    if (!uid) {
      return
    }
    try {
      setLoading(true)
      setError('')
      const tokenToUse = tokenOverride || idToken
      const res = await axios.get(`${API_BASE}/api/mentor/${uid}/progress`, { headers: authHeaders(tokenToUse) })
      const payload = res?.data || {}
      const next = {
        mentees: Number(payload?.mentees ?? 0),
        active: Number(payload?.active ?? 0),
        averageCompletion: Number(payload?.averageCompletion ?? 0),
      }
      setProgress(next)
      setForm({
        mentees: String(next.mentees || ''),
        active: String(next.active || ''),
        completion: next.averageCompletion ? String(Math.round(next.averageCompletion * 100)) : '',
      })
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
        loadProgress(session.uid, token)
      }
    })()
  }, [loadProgress])

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return
    setRefreshing(true)
    await loadProgress(user.uid, idToken)
    setRefreshing(false)
  }, [idToken, loadProgress, user?.uid])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = useCallback(async () => {
    if (!user?.uid) return
    try {
      setSaving(true)
      setError('')
      const body = {
        mentees: Number(form.mentees) || 0,
        active: Number(form.active) || 0,
        averageCompletion: Math.min(Math.max(Number(form.completion) / 100, 0), 1),
      }
      const token = idToken || (await getSession())?.idToken || ''
      const res = await axios.put(`${API_BASE}/api/mentor/${user.uid}/progress`, body, { headers: authHeaders(token) })
      const next = res?.data || {}
      setProgress({
        mentees: Number(next?.mentees ?? body.mentees),
        active: Number(next?.active ?? body.active),
        averageCompletion: Number(next?.averageCompletion ?? body.averageCompletion),
      })
      setForm({
        mentees: String(body.mentees || ''),
        active: String(body.active || ''),
        completion: String(Math.round((body.averageCompletion || 0) * 100)),
      })
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to reach server')
    } finally {
      setSaving(false)
    }
  }, [authHeaders, form.active, form.completion, form.mentees, idToken, user?.uid])

  const pct = Math.round((progress?.averageCompletion ?? 0) * 100)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroTitle}>Progress</Text>
        <Text style={styles.heroSub}>Overview of mentee activity</Text>
      </LinearGradient>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={[styles.card, styles.cardGlass]}> 
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📈</Text>
          <Text style={styles.cardTitle}>Summary</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
        ) : (
          <>
            <View style={styles.kpiRow}>
              <View style={styles.chip}><Text style={styles.chipText}>Mentees: {progress?.mentees ?? 0}</Text></View>
              <View style={styles.chip}><Text style={styles.chipText}>Active: {progress?.active ?? 0}</Text></View>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(Math.max(pct, 0), 100)}%` }]} />
            </View>
            <Text style={styles.meta}>{pct}% average completion</Text>
          </>
        )}
      </View>

      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.formTitle}>Update Progress</Text>
        <TextInput
          placeholder="Total mentees"
          value={form.mentees}
          onChangeText={(value) => handleChange('mentees', value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Active mentees"
          value={form.active}
          onChangeText={(value) => handleChange('active', value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Average completion %"
          value={form.completion}
          onChangeText={(value) => handleChange('completion', value.replace(/[^0-9]/g, ''))}
          keyboardType="numeric"
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TouchableOpacity style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]} onPress={handleSave} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Progress'}</Text>
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
    card: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 22, padding: 20, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    cardGlass: { backgroundColor: theme.surface },
    cardAccent: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 22, padding: 20, gap: 12, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
    sectionIcon: { fontSize: 18, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(148, 163, 184, 0.18)', color: theme.text },
    cardTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    chip: { flex: 1, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: 'center' },
    chipText: { color: theme.primary, fontWeight: '600' },
    progressTrack: { height: 12, borderRadius: 999, backgroundColor: 'rgba(148, 163, 184, 0.18)', overflow: 'hidden', marginTop: 12 },
    progressFill: { height: '100%', backgroundColor: theme.primary },
    meta: { color: theme.textSecondary, marginTop: 8 },
    formTitle: { fontSize: 18, fontWeight: '700', color: theme.primary },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: theme.card, color: theme.text },
    primaryBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: theme.primary },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
    error: { color: theme.toastError, marginBottom: 8 },
  })
