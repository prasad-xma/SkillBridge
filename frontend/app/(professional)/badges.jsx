import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useColorScheme } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Badges() {
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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <View style={styles.heroAccent2} />
        <Text style={styles.heroTitle}>Badges</Text>
        <Text style={styles.heroSub}>Your achievements and milestones</Text>
      </View>
      {error ? <Text style={{ color: '#ef4444' }}>{error}</Text> : null}
      <View style={[styles.card, styles.cardGlass]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🏅</Text>
          <Text style={styles.cardTitle}>All Badges</Text>
        </View>
        <View style={styles.grid}>
          {(data?.badges || []).map((b) => (
            <View key={b.id} style={[styles.badge, b.earned ? styles.badgeEarned : styles.badgeDefault]}>
              <Text style={[styles.badgeText, b.earned ? styles.primaryText : styles.secondaryText]}>{b.name}</Text>
            </View>
          ))}
          {!data?.badges?.length ? <Text style={styles.secondaryText}>No badges yet</Text> : null}
        </View>
      </View>
    </ScrollView>
  )
}

const UI = {
  colors: {
    primary: '#2563eb',
    heroBg: '#e0f2fe',
    heroAccent1: '#bae6fd',
    heroAccent2: '#cff0ff',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardBgBlue: '#f8fbff',
    cardBorderBlue: '#bfdbfe',
    muted: '#64748b',
  },
  radius: { md: 14, full: 9999 },
  font: { lg: 16, xl: 22 },
  weight: { bold: '800', semibold: '700' },
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1 },
  badgeDefault: { borderColor: UI.colors.cardBorder, backgroundColor: UI.colors.cardBg },
  badgeEarned: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  badgeText: { fontWeight: UI.weight.semibold },
  primaryText: { color: UI.colors.primary },
  secondaryText: { color: UI.colors.muted },
})
