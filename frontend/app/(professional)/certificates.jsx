import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Certificates() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
    })()
  }, [])

  const onGenerate = async () => {
    if (!user?.uid) return
    setLoading(true)
    setMessage('')
    try {
      const res = await axios.post(`${API_BASE}/api/mentor/certificate/generate`, { menteeId: 'sample', courseId: 'sample' })
      setMessage(res?.data?.message || 'Done')
    } catch (e) {
      setMessage(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <View style={styles.heroAccent2} />
        <Text style={styles.heroTitle}>Certificates</Text>
        <Text style={styles.heroSub}>Generate and share certificates</Text>
      </View>
      <View style={[styles.card, styles.cardBlue]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎓</Text>
          <Text style={styles.cardTitle}>Actions</Text>
        </View>
        <TouchableOpacity onPress={onGenerate} style={styles.primaryBtn} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Generating...' : 'Generate Sample Certificate'}</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.meta}>{message}</Text> : null}
      </View>
    </ScrollView>
  )
}

const UI = {
  colors: {
    primary: '#2563eb',
    primarySoft: '#3b82f6',
    heroBg: '#e0f2fe',
    heroAccent1: '#bae6fd',
    heroAccent2: '#cff0ff',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardBgBlue: '#f8fbff',
    cardBorderBlue: '#bfdbfe',
    muted: '#64748b',
  },
  radius: { sm: 10, md: 14, full: 9999 },
  font: { sm: 12, lg: 16, xl: 22 },
  weight: { semibold: '700', bold: '800' },
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  hero: { position: 'relative', padding: 16, paddingTop: 18, marginBottom: 10, backgroundColor: UI.colors.heroBg, borderRadius: UI.radius.md, overflow: 'hidden' },
  heroAccent: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: UI.radius.full, backgroundColor: UI.colors.heroAccent1 },
  heroAccent2: { position: 'absolute', left: -30, bottom: -30, width: 120, height: 120, borderRadius: UI.radius.full, backgroundColor: UI.colors.heroAccent2 },
  heroTitle: { fontSize: UI.font.xl, fontWeight: UI.weight.bold, color: '#0ea5e9' },
  heroSub: { color: '#0369a1', marginTop: 4 },
  card: { borderWidth: 1, borderRadius: UI.radius.md, padding: 14, marginTop: 14, backgroundColor: UI.colors.cardBg, borderColor: UI.colors.cardBorder, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardBlue: { borderColor: UI.colors.cardBorderBlue, backgroundColor: UI.colors.cardBgBlue },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 16, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: UI.radius.full },
  cardTitle: { fontSize: UI.font.lg, fontWeight: UI.weight.bold, color: '#0f172a' },
  primaryBtn: { paddingVertical: 12, borderRadius: UI.radius.sm, alignItems: 'center', backgroundColor: UI.colors.primarySoft },
  primaryBtnText: { color: '#fff', fontWeight: UI.weight.semibold },
  meta: { color: UI.colors.muted, marginTop: 10 },
})
