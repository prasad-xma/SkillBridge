import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Progress() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
      if (s?.uid) {
        try {
          setData((prev) => prev || null)
        } catch (e) {
          setError(e?.response?.data?.message || e.message)
        }
      }
    })()
  }, [])

  const pct = Math.round((data?.progress?.averageCompletion ?? 0) * 100)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <View style={styles.heroAccent2} />
        <Text style={styles.heroTitle}>Progress</Text>
        <Text style={styles.heroSub}>Overview of mentee activity</Text>
      </View>
      {error ? <Text style={{ color: '#ef4444' }}>{error}</Text> : null}
      <View style={[styles.card, styles.cardGlass]}> 
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📈</Text>
          <Text style={styles.cardTitle}>Summary</Text>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.chip}><Text style={styles.chipText}>Mentees: {data?.progress?.mentees ?? '-'}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Active: {data?.progress?.active ?? '-'}</Text></View>
        </View>
        <View style={styles.progressBarWrap}>
          <View style={[styles.progressBar, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.meta}>{pct}% average completion</Text>
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
    track: '#e0e7ff',
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
  cardGlass: { borderColor: UI.colors.cardBorderBlue, backgroundColor: 'rgba(255,255,255,0.65)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { fontSize: 16, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: UI.radius.full },
  cardTitle: { fontSize: UI.font.lg, fontWeight: UI.weight.bold, color: '#0f172a' },
  meta: { color: UI.colors.muted, marginBottom: 6 },
  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: UI.radius.sm, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: UI.colors.cardBorderBlue },
  chipText: { color: UI.colors.primary, fontWeight: UI.weight.semibold, fontSize: UI.font.sm },
  progressBarWrap: { height: 10, borderRadius: 8, backgroundColor: UI.colors.track, overflow: 'hidden', marginVertical: 8 },
  progressBar: { height: 10, backgroundColor: UI.colors.primarySoft },
})
