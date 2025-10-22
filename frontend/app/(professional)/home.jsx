import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useColorScheme, Image, Pressable, ActivityIndicator, Modal, Animated } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function ProfessionalHome() {
  const [user, setUser] = useState(null)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [activeTab, setActiveTab] = useState('Overview') // Overview | Courses | Mentees
  const [timeframe, setTimeframe] = useState('30d') // 7d | 30d | 90d
  const [tipsOpen, setTipsOpen] = useState(false)
  const [progressAnim] = useState(new Animated.Value(0))
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const initials = (user?.fullName || '')
    .split(' ')
    .map((n) => n?.[0] || '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
      if (s?.uid) {
        try {
          setLoadingCourses(true)
          const courseRes = await axios.get(`${API_BASE}/courses`)
          setCourses(Array.isArray(courseRes.data) ? courseRes.data : [])
          setData((prev) => prev || null)
        } catch (e) {
          setError(e?.response?.data?.message || e.message)
        } finally {
          setLoadingCourses(false)
        }
      }
    })()
  }, [])

  const pct = Math.round((data?.progress?.averageCompletion ?? 0) * 100)
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: pct, duration: 700, useNativeDriver: false }).start()
  }, [pct])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <View style={styles.heroAccent2} />
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Mentor Dashboard</Text>
            {user ? <Text style={styles.heroSub}>Welcome, {user.fullName}</Text> : null}
            <Text style={styles.heroQuote}>“Keep guiding minds forward ✨”</Text>
          </View>
        </View>
      </View>
      {error ? <Text style={{ color: '#ef4444', marginBottom: 8 }}>{error}</Text> : null}

      

      {/* Your Stats */}
      <Text style={styles.sectionKicker}>Your Stats</Text>

      {/* Grid: Streaks + Badges */}
      <View style={styles.gridRow}>
        <Pressable style={({ pressed }) => [styles.card, styles.cardGlass, styles.half, pressed && styles.cardPressed]}> 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔥</Text>
            <Text style={styles.sectionTitle}>Streaks</Text>
          </View>
          <View style={styles.row}> 
            <View style={[styles.pill, styles.pillPrimary]}> 
              <Text style={[styles.pillValue, styles.primaryText]}>{data?.streaks?.current ?? '-'}</Text>
              <Text style={styles.pillLabel}>Current</Text>
            </View>
            <View style={[styles.pill, styles.pillPrimary]}> 
              <Text style={[styles.pillValue, styles.primaryText]}>{data?.streaks?.longest ?? '-'}</Text>
              <Text style={styles.pillLabel}>Longest</Text>
            </View>
          </View>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.card, styles.cardGlass, styles.half, pressed && styles.cardPressed]}> 
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏅</Text>
            <Text style={styles.sectionTitle}>Badges</Text>
          </View>
          <View style={styles.badges}> 
            {(data?.badges || []).slice(0, 6).map((b) => (
              <View key={b.id} style={[styles.badge, b.earned ? styles.badgeEarned : styles.badgeDefault]}> 
                <Text style={[styles.badgeText, b.earned ? styles.primaryText : styles.secondaryText]}>{b.name}</Text>
              </View>
            ))}
            {!data?.badges?.length ? <Text style={styles.secondaryText}>No badges yet</Text> : null}
          </View>
        </Pressable>
      </View>

      {/* Progress Summary */}
      <View style={[styles.card, styles.cardGlass]}> 
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📈</Text>
          <Text style={styles.sectionTitle}>Progress Summary</Text>
        </View>
        <Text style={styles.meta}>Mentees: {data?.progress?.mentees ?? '-'}</Text>
        <Text style={styles.meta}>Active: {data?.progress?.active ?? '-'}</Text>
        <View style={styles.progressBarWrap}>
          <Animated.View style={[styles.progressBar, { width: progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Text style={styles.meta}>{pct}% average completion</Text>
      </View>

      {/* Courses Tracking */}
      <View style={[styles.card, styles.cardGlass]}> 
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📚</Text>
          <Text style={styles.sectionTitle}>Courses Tracking</Text>
        </View>
        <Text style={styles.meta}>Total Courses: {courses.length}</Text>
        <Text style={styles.meta}>Total Chapters: {courses.reduce((sum, c) => sum + (Array.isArray(c.chapters) ? c.chapters.length : 0), 0)}</Text>
        <Text style={[styles.meta, { marginBottom: 8 }]}>Average Fee: {courses.length ? Math.round(courses.reduce((sum, c) => sum + (Number(c.fees) || 0), 0) / courses.length) : 0}</Text>
        <View style={styles.sectionHeaderSmall}><Text style={styles.sectionTitleSmall}>Recent</Text></View>
        {loadingCourses ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={UI.colors.primarySoft} />
            <Text style={styles.meta}>Loading courses…</Text>
          </View>
        ) : (
          <View style={styles.courseGrid}>
            {courses.slice(0, 4).map((c) => (
              <Pressable key={c.id} style={({ pressed }) => [styles.courseCard, pressed && styles.courseCardPressed]}>
                {c.thumbnailUrl ? (
                  <Image source={{ uri: c.thumbnailUrl }} style={styles.courseThumb} />
                ) : (
                  <View style={[styles.courseThumb, styles.courseThumbPlaceholder]} />
                )}
                <Text numberOfLines={1} style={styles.courseTitle}>{c.courseName}</Text>
              </Pressable>
            ))}
            {!courses.length ? <Text style={styles.secondaryText}>No courses yet</Text> : null}
          </View>
        )}
      </View>

      {/* Tips Dialog */}
      <Modal visible={tipsOpen} transparent animationType="fade" onRequestClose={() => setTipsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.cardTitle}>UI Tips</Text>
            <Text style={styles.meta}>Use concise labels, consistent spacing, and clear visual hierarchy. Favor blue accents and soft backgrounds for a calm, professional look.</Text>
            <Pressable onPress={() => setTipsOpen(false)} style={[styles.primaryBtn, { marginTop: 12 }]}>
              <Text style={{ color: '#fff', fontWeight: UI.weight.semibold }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const UI = {
  colors: {
    primary: '#3B82F6',
    primarySoft: '#60A5FA',
    darkBlue: '#1E3A8A',
    lightBlue: '#E0F2FE',
    heroBg: '#E0F2FE',
    heroAccent1: '#BAE6FD',
    heroAccent2: '#CFF0FF',
    cardBg: '#FFFFFF',
    cardBorder: '#E2E8F0',
    cardBgBlue: '#F8FAFC',
    cardBorderBlue: '#BFDBFE',
    textDark: '#1E293B',
    muted: '#64748B',
    track: '#E0E7FF',
    placeholder: '#E2E8F0',
    shadowTint: 'rgba(59, 130, 246, 0.15)',
  },
  radius: { sm: 12, md: 20, lg: 24, full: 9999 },
  spacing: { xs: 6, sm: 8, md: 12, lg: 16, xl: 20 },
  font: { sm: 12, md: 14, lg: 16, xl: 22 },
  weight: { bold: '700', semibold: '600' },
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  hero: { position: 'relative', padding: UI.spacing.xl, paddingTop: 18, marginBottom: 12, backgroundColor: UI.colors.heroBg, borderRadius: UI.radius.lg, overflow: 'hidden' },
  heroAccent: { position: 'absolute', right: -40, top: -40, width: 180, height: 180, borderRadius: UI.radius.full, backgroundColor: UI.colors.heroAccent1 },
  heroAccent2: { position: 'absolute', left: -30, bottom: -30, width: 140, height: 140, borderRadius: UI.radius.full, backgroundColor: UI.colors.heroAccent2 },
  heroTitle: { fontSize: UI.font.xl, fontWeight: UI.weight.bold, color: UI.colors.darkBlue },
  heroSub: { color: UI.colors.textDark, marginTop: 4, fontWeight: UI.weight.semibold },
  heroQuote: { color: UI.colors.muted, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: UI.radius.md, padding: UI.spacing.xl, marginTop: UI.spacing.lg, backgroundColor: UI.colors.cardBg, borderColor: UI.colors.cardBorder, shadowColor: UI.colors.shadowTint, shadowOpacity: 1, shadowRadius: 8, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  cardBlue: { borderColor: UI.colors.cardBorderBlue, backgroundColor: UI.colors.cardBgBlue },
  cardGlass: { borderColor: UI.colors.cardBorderBlue, backgroundColor: 'rgba(255,255,255,0.75)' },
  cardTitle: { fontSize: UI.font.lg, fontWeight: UI.weight.bold, marginBottom: 10, color: UI.colors.darkBlue },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionHeaderSmall: { marginTop: 6, marginBottom: 6 },
  sectionIcon: { fontSize: 16, backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, overflow: 'hidden' },
  sectionTitle: { fontSize: 16, fontWeight: UI.weight.bold, color: UI.colors.primary },
  sectionTitleSmall: { fontSize: 14, fontWeight: UI.weight.bold, color: UI.colors.textDark },
  row: { flexDirection: 'row', gap: 12 },
  pill: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  pillPrimary: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  pillValue: { fontSize: 20, fontWeight: '800' },
  pillLabel: { marginTop: 4, fontSize: 12, color: UI.colors.muted },
  primaryText: { color: UI.colors.primary },
  secondaryText: { color: UI.colors.muted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderRadius: 20 },
  badgeDefault: { borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  badgeEarned: { borderColor: '#93c5fd', backgroundColor: '#eff6ff' },
  badgeText: { fontWeight: '600' },
  progressBarWrap: { height: 12, borderRadius: 10, backgroundColor: UI.colors.track, overflow: 'hidden', marginBottom: 6, position: 'relative' },
  progressBar: { height: 12, backgroundColor: UI.colors.primary },
  progressLabel: { position: 'absolute', left: 8, top: 0, bottom: 0, textAlignVertical: 'center', color: UI.colors.muted, fontSize: UI.font.sm },
  courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  courseCard: { width: '48%', backgroundColor: UI.colors.cardBg, borderWidth: 1, borderColor: UI.colors.cardBorder, borderRadius: UI.radius.md, overflow: 'hidden', padding: 8, shadowColor: UI.colors.shadowTint, shadowOpacity: 1, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  courseCardPressed: { transform: [{ scale: 1.03 }] },
  courseThumb: { width: '100%', aspectRatio: 16/9, borderRadius: UI.radius.sm, backgroundColor: UI.colors.placeholder },
  courseThumbPlaceholder: { backgroundColor: UI.colors.placeholder },
  courseTitle: { marginTop: 6, color: UI.colors.muted, fontWeight: UI.weight.semibold, fontSize: UI.font.sm },
  bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: UI.colors.primarySoft },
  recentItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
})
