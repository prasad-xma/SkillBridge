import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme, TextInput, RefreshControl, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Certificates() {
  const [user, setUser] = useState(null)
  const [idToken, setIdToken] = useState('')
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ menteeId: '', menteeName: '', courseId: '', courseName: '', notes: '' })
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const styles = useMemo(() => createStyles(theme), [theme])

  const authHeaders = useCallback((token) => (token ? { Authorization: `Bearer ${token}` } : {}), [])

  const loadCertificates = useCallback(async (uid, tokenOverride) => {
    if (!uid) {
      return
    }
    try {
      setLoading(true)
      setError('')
      const tokenToUse = tokenOverride || idToken
      console.log('[Certificates] load certificates', { API_BASE, uid })
      const res = await axios.get(`${API_BASE}/api/mentor/${uid}/certificates`, { headers: authHeaders(tokenToUse) })
      setCertificates(Array.isArray(res?.data?.certificates) ? res.data.certificates : [])
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
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
        loadCertificates(session.uid, token)
      }
    })()
  }, [loadCertificates])

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return
    setRefreshing(true)
    await loadCertificates(user.uid, idToken)
    setRefreshing(false)
  }, [idToken, loadCertificates, user?.uid])

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleAddCertificate = useCallback(async () => {
    if (!user?.uid || !form.menteeId.trim() || !form.courseId.trim()) {
      setError('Mentee ID and Course ID are required')
      return
    }
    try {
      setSaving(true)
      setError('')
      const payload = {
        menteeId: form.menteeId.trim(),
        menteeName: form.menteeName.trim() || null,
        courseId: form.courseId.trim(),
        courseName: form.courseName.trim() || null,
        notes: form.notes.trim() || null,
        issuedBy: user?.fullName || 'Mentor',
      }
      const token = idToken || (await getSession())?.idToken || ''
      console.log('[Certificates] add certificate', { API_BASE, uid: user.uid, payload })
      const res = await axios.post(`${API_BASE}/api/mentor/${user.uid}/certificate`, payload, { headers: authHeaders(token) })
      setCertificates(Array.isArray(res?.data?.certificates) ? res.data.certificates : [])
      setForm({ menteeId: '', menteeName: '', courseId: '', courseName: '', notes: '' })
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setSaving(false)
    }
  }, [authHeaders, form.courseId, form.courseName, form.menteeId, form.menteeName, form.notes, idToken, user?.fullName, user?.uid])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
    >
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroTitle}>Certificates</Text>
        <Text style={styles.heroSub}>Generate and share certificates</Text>
      </LinearGradient>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.card, styles.cardGlass]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎓</Text>
          <Text style={styles.cardTitle}>Issued Certificates</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
        ) : certificates.length ? (
          certificates.map((certificate) => (
            <View key={certificate.id} style={styles.certItem}>
              <Text style={styles.certTitle}>{certificate.courseName || certificate.courseId}</Text>
              <Text style={styles.meta}>Mentee: {certificate.menteeName || certificate.menteeId}</Text>
              <Text style={styles.meta}>Issued: {certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Recently'}</Text>
              {certificate.notes ? <Text style={styles.meta}>{certificate.notes}</Text> : null}
            </View>
          ))
        ) : (
          <Text style={styles.meta}>No certificates added yet.</Text>
        )}
      </View>

      <View style={[styles.card, styles.cardAccent]}>
        <Text style={styles.formTitle}>Issue New Certificate</Text>
        <TextInput
          placeholder="Mentee ID"
          value={form.menteeId}
          onChangeText={(value) => handleChange('menteeId', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Mentee name (optional)"
          value={form.menteeName}
          onChangeText={(value) => handleChange('menteeName', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Course ID"
          value={form.courseId}
          onChangeText={(value) => handleChange('courseId', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Course name (optional)"
          value={form.courseName}
          onChangeText={(value) => handleChange('courseName', value)}
          style={styles.input}
          placeholderTextColor={theme.textSecondary}
        />
        <TextInput
          placeholder="Notes"
          value={form.notes}
          onChangeText={(value) => handleChange('notes', value)}
          style={[styles.input, styles.textArea]}
          placeholderTextColor={theme.textSecondary}
          multiline
        />
        <TouchableOpacity style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]} onPress={handleAddCertificate} disabled={saving}>
          <Text style={styles.primaryBtnText}>{saving ? 'Saving…' : 'Save Certificate'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { padding: 20, gap: 18, backgroundColor: theme.background, paddingBottom: 96 },
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
    meta: { color: theme.textSecondary, marginTop: 6 },
    certItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 4 },
    certTitle: { fontWeight: '700', color: theme.text },
    formTitle: { fontSize: 18, fontWeight: '700', color: theme.primary },
    input: { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, marginBottom: 12, backgroundColor: theme.card, color: theme.text },
    textArea: { height: 96, textAlignVertical: 'top' },
    primaryBtn: { paddingVertical: 12, borderRadius: 14, alignItems: 'center', backgroundColor: theme.primary },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
    error: { color: theme.toastError, marginBottom: 8 },
  })
