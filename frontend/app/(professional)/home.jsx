import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, useColorScheme, Image, Pressable, ActivityIndicator, Modal, Animated, RefreshControl } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function ProfessionalHome() {
  const [user, setUser] = useState(null)
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [progressAnim] = useState(new Animated.Value(0))
  const [showStreakDetails, setShowStreakDetails] = useState(false)
  const [streakDetailType, setStreakDetailType] = useState('current')
  const [showBadgesModal, setShowBadgesModal] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState(null)
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])
  const styles = useMemo(() => createStyles(theme), [theme])
  const initials = useMemo(() => {
    return (user?.fullName || '')
      .split(' ')
      .map((n) => n?.[0] || '')
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }, [user?.fullName])

  const fetchDashboard = useCallback(
    async (mentorId) => {
      if (!mentorId) {
        return
      }

      try {
        setDashboardLoading(true)
        console.log('[ProfessionalHome] fetching dashboard', { API_BASE, mentorId })
        const response = await axios.get(`${API_BASE}/api/mentor/${mentorId}/dashboard`, {
          headers: {
            Authorization: `Bearer ${(await getSession()).idToken}`,
          },
        })

        const payload = response?.data || {}
        setDashboard({
          streak: payload.streak || { streakCount: 0, longestStreak: 0, lastActiveDate: null },
          badges: Array.isArray(payload.badges) ? payload.badges : [],
          progress: payload.progress || { mentees: 0, active: 0, averageCompletion: 0 },
        })
        setDashboardLoading(false)
      } catch (err) {
        console.log('[ProfessionalHome] dashboard error', err?.response?.status, err?.response?.data || err.message)
        setError(err?.response?.data?.message || err.message || 'Failed to reach server')
        setDashboardLoading(false)
      }
    },
    []
  )

  const normalizeTimestamp = useCallback((value) => {
    if (!value) return null
    if (typeof value === 'string') return value
    if (value instanceof Date) return value.toISOString()
    if (typeof value === 'number') {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date.toISOString()
    }
    const seconds = value?.seconds ?? value?._seconds
    if (typeof seconds === 'number') {
      const nanos = value?.nanoseconds ?? value?._nanoseconds ?? 0
      const date = new Date(seconds * 1000 + nanos / 1e6)
      return Number.isNaN(date.getTime()) ? null : date.toISOString()
    }
    if (typeof value?.toDate === 'function') {
      return value.toDate().toISOString()
    }
    return null
  }, [])

  const mapCourse = useCallback(
    (course) => {
      const createdAt = normalizeTimestamp(course?.createdAt ?? course?.created_at)
      const updatedAt = normalizeTimestamp(course?.updatedAt ?? course?.updated_at) || createdAt
      const chapterCount = Array.isArray(course?.chapters)
        ? course.chapters.length
        : Number(course?.chapters) || 0
      const numericFees = Number(course?.fees) || 0
      return {
        ...course,
        createdAt,
        updatedAt,
        chapterCount,
        fees: numericFees,
      }
    },
    [normalizeTimestamp]
  )

  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true)
      const response = await axios.get(`${API_BASE}/courses`)
      const items = Array.isArray(response.data) ? response.data.map(mapCourse) : []
      setCourses(items)
    } catch (err) {
      setError(err?.response?.data?.message || err.message)
    } finally {
      setLoadingCourses(false)
    }
  }, [mapCourse])

  const initialize = useCallback(async () => {
    const session = await getSession()
    setUser(session)
    const mentorId = session?.uid

    await Promise.all([
      fetchDashboard(mentorId),
      fetchCourses(),
    ])
  }, [fetchDashboard, fetchCourses])

  useEffect(() => {
    initialize()
  }, [initialize])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await initialize()
    } finally {
      setRefreshing(false)
    }
  }, [initialize])

  const streak = dashboard?.streak || { streakCount: 0, longestStreak: 0, lastActiveDate: null }
  const badges = dashboard?.badges || []
  const progress = dashboard?.progress || { mentees: 0, active: 0, averageCompletion: 0 }
  const pct = Math.round((progress?.averageCompletion ?? 0) * 100)

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: pct, duration: 700, useNativeDriver: false }).start()
  }, [pct])

  const formatDate = (iso) => {
    if (!iso) {
      return null
    }
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
      return null
    }
    return date.toLocaleDateString()
  }

  const getStreakMessage = (type, value) => {
    const count = Number(value) || 0
    if (count <= 0) {
      return type === 'current'
        ? 'Start your streak by engaging with mentees today.'
        : 'Keep helping mentees to set a new record.'
    }
    if (count < 3) {
      return 'Great start! Keep up the consistency.'
    }
    if (count < 7) {
      return 'Awesome momentum! You are building strong habits.'
    }
    if (count < 14) {
      return 'Fantastic dedication! Your mentees appreciate you.'
    }
    return 'Incredible commitment! You are a mentoring star.'
  }

  const handleStreakPress = (type) => {
    setStreakDetailType(type)
    setShowStreakDetails(true)
  }

  const handleBadgePress = (badge) => {
    setSelectedBadge(badge)
    setShowBadgesModal(true)
  }

  const getBadgeDescription = (badge) => {
    if (!badge) {
      return ''
    }
    if (badge.description) {
      return badge.description
    }
    const name = (badge.name || '').toLowerCase()
    if (name.includes('first')) return 'Celebrates your very first mentoring milestone.'
    if (name.includes('session')) return 'Awarded for delivering impactful mentoring sessions.'
    if (name.includes('mentee')) return 'Earned for successfully guiding mentees.'
    if (name.includes('week')) return 'Consistency pays off! You were active all week.'
    if (name.includes('feedback')) return 'Recognises outstanding feedback from mentees.'
    return 'A special badge recognising your mentoring achievements.'
  }

  const formatBadgeDate = (iso) => {
    const formatted = formatDate(iso)
    return formatted ? `Earned on ${formatted}` : 'Earned recently'
  }

  const sortedCourses = useMemo(() => {
    const getTime = (course) => {
      const value = course?.updatedAt || course?.createdAt
      if (!value) return 0
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? 0 : date.getTime()
    }
    return [...courses].sort((a, b) => getTime(b) - getTime(a))
  }, [courses])

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}>
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Mentor Dashboard</Text>
            {user ? <Text style={styles.heroSub}>{`Welcome, ${user.fullName}`}</Text> : null}
            <Text style={styles.heroQuote}>Empower your mentees every day.</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'M'}</Text>
          </View>
        </View>
      </LinearGradient>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {dashboardLoading ? (
        <View style={styles.loadingBlock}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading your mentoring insights…</Text>
        </View>
      ) : null}

      {/* Your Stats */}
      <Text style={styles.sectionKicker}>Your Snapshot</Text>

      {/* Grid: Streaks + Badges */}
      <View style={styles.gridRow}>
        <Pressable
          style={({ pressed }) => [styles.card, styles.cardGlass, styles.half, pressed && styles.cardPressed]}
          onPress={() => handleStreakPress('current')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔥</Text>
            <Text style={styles.sectionTitle}>Streaks</Text>
          </View>
          {dashboardLoading ? (
            <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
          ) : (
            <View style={styles.row}>
              <Pressable onPress={() => handleStreakPress('current')} style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
                <Text style={styles.pillValue}>{streak.streakCount ?? 0}</Text>
                <Text style={styles.pillLabel}>Current</Text>
              </Pressable>
              <Pressable onPress={() => handleStreakPress('longest')} style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
                <Text style={styles.pillValue}>{streak.longestStreak ?? 0}</Text>
                <Text style={styles.pillLabel}>Longest</Text>
              </Pressable>
            </View>
          )}
          <Text style={styles.metaSmall}>
            {streak.lastActiveDate ? `Last active: ${formatDate(streak.lastActiveDate)}` : 'No activity recorded yet'}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.card, styles.cardGlass, styles.half, pressed && styles.cardPressed]}
          onPress={() => (badges.length ? setShowBadgesModal(true) : undefined)}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🏅</Text>
            <Text style={styles.sectionTitle}>Badges</Text>
          </View>
          {dashboardLoading ? (
            <ActivityIndicator size="small" color={theme.primary} style={styles.loader} />
          ) : badges.length ? (
            <View style={styles.badgeGrid}>
              {badges.slice(0, 4).map((badge) => {
                const key = `${badge?.id || badge?.name}`
                return (
                  <Pressable
                    key={key}
                    onPress={() => handleBadgePress(badge)}
                    style={({ pressed }) => [styles.badgeCircle, pressed && styles.badgeCirclePressed]}
                  >
                    <Text style={styles.badgeCircleText}>{(badge?.name || '?')[0]}</Text>
                    <Text numberOfLines={1} style={styles.badgeCircleLabel}>{badge?.name}</Text>
                  </Pressable>
                )
              })}
              {badges.length > 4 ? (
                <View style={[styles.badgeCircle, styles.badgeCircleMore]}>
                  <Text style={styles.badgeCircleText}>+{badges.length - 4}</Text>
                  <Text style={styles.badgeCircleLabel}>More</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <Text style={styles.secondaryText}>No badges yet. Complete milestones to earn one!</Text>
          )}
        </Pressable>
      </View>

      {/* Progress Summary */}
      <View style={[styles.card, styles.cardGlass]}> 
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📈</Text>
          <Text style={styles.sectionTitle}>Progress Summary</Text>
        </View>
        <Text style={styles.meta}>Mentees: {progress?.mentees ?? 0}</Text>
        <Text style={styles.meta}>Active: {progress?.active ?? 0}</Text>
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
        <Text style={styles.meta}>Total Chapters: {courses.reduce((sum, c) => sum + (c.chapterCount || 0), 0)}</Text>
        <Text style={[styles.meta, { marginBottom: 8 }]}>Average Fee: {courses.length ? Math.round(courses.reduce((sum, c) => sum + (c.fees || 0), 0) / courses.length) : 0}</Text>
        <View style={styles.sectionHeaderSmall}><Text style={styles.sectionTitleSmall}>Recent</Text></View>
        {loadingCourses ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.meta}>Loading courses…</Text>
          </View>
        ) : (
          <View style={styles.courseGrid}>
            {sortedCourses.slice(0, 4).map((course) => {
              const key = course.id || course.courseId || course._id || course.name
              const totalChapters = course.chapterCount || 0
              return (
                <Pressable key={key} style={({ pressed }) => [styles.courseCard, pressed && styles.courseCardPressed]}>
                  {course.thumbnailUrl ? (
                    <Image source={{ uri: course.thumbnailUrl }} style={styles.courseThumb} />
                  ) : (
                    <View style={styles.courseThumbPlaceholder} />
                  )}
                  <Text numberOfLines={1} style={styles.courseTitle}>{course.courseName}</Text>
                  <Text style={styles.courseMeta}>Chapters: {totalChapters}</Text>
                  <Text style={styles.courseMeta}>Fee: {course.fees || 0}</Text>
                  <Text style={styles.courseMeta}>
                    {course.updatedAt ? `Updated: ${formatDate(course.updatedAt)}` : course.createdAt ? `Created: ${formatDate(course.createdAt)}` : 'Recently added'}
                  </Text>
                </Pressable>
              )
            })}
            {!courses.length ? <Text style={styles.secondaryText}>No courses yet</Text> : null}
          </View>
        )}
      </View>

      {/* Tips Dialog */}
      <Modal visible={tipsOpen} transparent animationType="fade" onRequestClose={() => setTipsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>UI Tips</Text>
            <Text style={styles.meta}>Use concise labels, consistent spacing, and clear visual hierarchy. Favor vibrant accents and soft backgrounds for a calm, professional look.</Text>
            <Pressable onPress={() => setTipsOpen(false)} style={[styles.primaryBtn, { marginTop: 12 }]}> 
              <Text style={styles.primaryBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showStreakDetails} transparent animationType="fade" onRequestClose={() => setShowStreakDetails(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Your {streakDetailType === 'current' ? 'Current' : 'Longest'} Streak</Text>
            <Text style={styles.streakNumber}>
              {streakDetailType === 'current' ? streak.streakCount ?? 0 : streak.longestStreak ?? 0} days
            </Text>
            <Text style={styles.meta}>{getStreakMessage(streakDetailType, streakDetailType === 'current' ? streak.streakCount : streak.longestStreak)}</Text>
            <Pressable style={styles.primaryBtn} onPress={() => setShowStreakDetails(false)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showBadgesModal} transparent animationType="fade" onRequestClose={() => setShowBadgesModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, styles.badgeModal]}>
            <Text style={styles.modalTitle}>Badge Details</Text>
            {selectedBadge ? (
              <View style={styles.badgeDetail}>
                <View style={styles.badgeCircleLarge}>
                  <Text style={styles.badgeCircleTextLarge}>{(selectedBadge?.name || '?')[0]}</Text>
                </View>
                <Text style={styles.badgeDetailName}>{selectedBadge?.name}</Text>
                <Text style={styles.meta}>{formatBadgeDate(selectedBadge?.earnedDate)}</Text>
                <Text style={styles.meta}>{getBadgeDescription(selectedBadge)}</Text>
              </View>
            ) : badges.length ? (
              <View style={styles.badgeList}>
                {badges.map((badge) => {
                  const key = `${badge?.id || badge?.name}`
                  return (
                    <Pressable key={key} style={styles.badgeListItem} onPress={() => handleBadgePress(badge)}>
                      <View style={styles.badgeListIcon}>
                        <Text style={styles.badgeCircleText}>{(badge?.name || '?')[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.badgeDetailName}>{badge?.name}</Text>
                        <Text style={styles.metaSmall}>{formatBadgeDate(badge?.earnedDate)}</Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            ) : (
              <Text style={styles.meta}>No badges yet.</Text>
            )}
            <Pressable style={[styles.primaryBtn, styles.modalPrimaryBtn]} onPress={() => setShowBadgesModal(false)}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const createStyles = (theme) =>
  StyleSheet.create({
    container: { padding: 20, gap: 18, backgroundColor: theme.background },
    hero: { position: 'relative', padding: 24, marginBottom: 16, borderRadius: 24, overflow: 'hidden' },
    heroGlow: { position: 'absolute', bottom: -120, right: -80, width: 240, height: 240, backgroundColor: 'rgba(255, 255, 255, 0.18)', borderRadius: 9999 },
    heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
    heroTitle: { fontSize: 26, fontWeight: '700', color: theme.headerText },
    heroSub: { marginTop: 4, fontSize: 14, fontWeight: '600', color: theme.headerText, opacity: 0.92 },
    heroQuote: { marginTop: 12, fontSize: 13, color: theme.headerText, opacity: 0.85 },
    avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderColor: theme.headerText },
    avatarText: { fontSize: 20, fontWeight: '700', color: theme.headerText },
    errorText: { color: theme.toastError, marginBottom: 8 },
    loadingBlock: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, padding: 20, borderRadius: 20, alignItems: 'center', gap: 8 },
    loadingText: { color: theme.textSecondary },
    sectionKicker: { letterSpacing: 1, textTransform: 'uppercase', fontSize: 12, fontWeight: '600', color: theme.textSecondary },
    gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
    half: { flex: 1, minWidth: '47%' },
    card: { borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 22, padding: 20, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 14, shadowOffset: { width: 0, height: 10 }, elevation: 3 },
    cardGlass: { backgroundColor: theme.surface },
    cardPressed: { transform: [{ scale: 0.98 }], opacity: 0.95 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    sectionHeaderSmall: { marginTop: 10, marginBottom: 8 },
    sectionIcon: { fontSize: 18, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, backgroundColor: 'rgba(148, 163, 184, 0.18)', color: theme.text },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    sectionTitleSmall: { fontSize: 15, fontWeight: '600', color: theme.text },
    row: { flexDirection: 'row', gap: 12 },
    pill: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.28)', backgroundColor: theme.surface },
    pillPressed: { opacity: 0.9 },
    pillValue: { fontSize: 22, fontWeight: '700', color: theme.primary },
    pillLabel: { marginTop: 6, fontSize: 12, color: theme.textSecondary },
    loader: { paddingVertical: 12 },
    metaSmall: { marginTop: 10, fontSize: 12, color: theme.textSecondary },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    badgeCircle: { width: 78, height: 78, borderRadius: 22, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', padding: 10, borderWidth: 1, borderColor: theme.border },
    badgeCirclePressed: { backgroundColor: theme.card },
    badgeCircleMore: { backgroundColor: theme.card },
    badgeCircleText: { fontSize: 18, fontWeight: '700', color: theme.primary },
    badgeCircleLabel: { fontSize: 10, marginTop: 6, color: theme.textSecondary },
    secondaryText: { color: theme.textSecondary },
    meta: { marginTop: 10, fontSize: 13, color: theme.textSecondary },
    progressBarWrap: { height: 12, borderRadius: 999, backgroundColor: 'rgba(148, 163, 184, 0.18)', overflow: 'hidden', marginBottom: 6 },
    progressBar: { height: 12, backgroundColor: theme.primary },
    courseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    courseCard: { width: '48%', borderWidth: 1, borderColor: theme.border, borderRadius: 20, overflow: 'hidden', padding: 12, backgroundColor: theme.card, shadowColor: theme.toastShadow, shadowOpacity: 1, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
    courseCardPressed: { transform: [{ scale: 1.02 }], opacity: 0.96 },
    courseThumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: 15, backgroundColor: 'rgba(148, 163, 184, 0.18)', marginBottom: 8 },
    courseThumbPlaceholder: { width: '100%', aspectRatio: 16 / 9, borderRadius: 15, backgroundColor: theme.surface, marginBottom: 8 },
    courseTitle: { fontSize: 14, fontWeight: '600', color: theme.text },
    courseMeta: { marginTop: 4, fontSize: 12, color: theme.textSecondary },
    loadingWrap: { paddingVertical: 16, alignItems: 'center', gap: 6 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(8, 15, 23, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { width: '100%', maxWidth: 360, borderRadius: 26, backgroundColor: theme.card, padding: 24, gap: 18, borderWidth: 1, borderColor: theme.border },
    modalTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    streakNumber: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: theme.primary },
    primaryBtn: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: { color: '#fff', fontWeight: '600' },
    badgeModal: { maxHeight: '80%', alignItems: 'center' },
    badgeDetail: { alignItems: 'center', gap: 10 },
    badgeCircleLarge: { width: 92, height: 92, borderRadius: 28, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    badgeCircleTextLarge: { fontSize: 32, fontWeight: '700', color: theme.primary },
    badgeDetailName: { fontSize: 16, fontWeight: '600', textAlign: 'center', color: theme.text },
    badgeList: { width: '100%', gap: 12 },
    badgeListItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
    badgeListIcon: { width: 50, height: 50, borderRadius: 18, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border },
    modalPrimaryBtn: { alignSelf: 'stretch' },
  })
