import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'
// import SwipeBackWrapper from '../components/SwipeBackWrapper'

export default function StudentHome() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)

  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (!s || s.role !== 'student') {
        router.replace('/login')
        return
      }
      setUser(s)
    })()
  }, [])

  const firstName = user?.fullName?.split(' ')?.[0] || 'Student'

  return (
    // <SwipeBackWrapper style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.tint + '22', borderColor: theme.tint + '55' }]}>
              <Text style={[styles.badgeText, { color: theme.tint }]}>Welcome</Text>
            </View>
          </View>

          <Text style={[styles.greeting, { color: theme.text }]}>
            {`Hi, ${firstName} 👋`}
          </Text>
          <Text style={[styles.headline, { color: theme.text }]}>
            Let’s discover your next skill!
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Explore courses, practice challenges, and grow your career, one step at a time.
          </Text>

        <View style={styles.sparklesRow}>
          <View style={[styles.spark, { backgroundColor: theme.primary + '1A' }]} />
          <View style={[styles.spark, { backgroundColor: theme.primary + '26', width: 10, height: 10 }]} />
          <View style={[styles.spark, { backgroundColor: theme.primary + '33', width: 6, height: 6 }]} />
        </View>
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/(student)/recommendations')}>
          <View style={[styles.quickIconWrap, { backgroundColor: theme.primary + '1A' }]}>
            <Ionicons name="sparkles" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.quickLabel, { color: theme.text }]}>Recommendations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/(student)/network')}>
          <View style={[styles.quickIconWrap, { backgroundColor: theme.accent + '1A' }]}>
            <Ionicons name="people-outline" size={18} color={theme.accent} />
          </View>
          <Text style={[styles.quickLabel, { color: theme.text }]}>Network</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickChip, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/(student)/jobs')}>
          <View style={[styles.quickIconWrap, { backgroundColor: theme.tint + '1A' }]}>
            <Ionicons name="briefcase-outline" size={18} color={theme.tint} />
          </View>
          <Text style={[styles.quickLabel, { color: theme.text }]}>Jobs</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.showcaseCard}>
        <View style={styles.showcaseArt} />
        <View style={styles.showcaseArtSm} />
        <View style={{ flex: 1 }}>
          <Text style={styles.showcaseTitle}>Level up faster</Text>
          <Text style={styles.showcaseSubtitle}>Explore curated learning paths crafted for you</Text>
        </View>
        <TouchableOpacity style={[styles.showcaseBtn, { backgroundColor: '#ffffff22', borderColor: '#ffffff44' }]} onPress={() => router.push('/(student)/recommendations')}>
          <Ionicons name="arrow-forward" size={16} color="#fff" />
          <Text style={styles.showcaseBtnText}>Explore</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={[styles.ctaCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={{ flex: 1 }}> 
          <Text style={[styles.ctaTitle, { color: theme.text }]}>Get Personalized Skill Recommendations</Text>
          <Text style={[styles.ctaSubtitle, { color: theme.textSecondary }]}>Take a quick 2-minute quiz so we can tailor suggestions to you.</Text>
        </View> 
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
          onPress={() => router.push('/(student)/questionnaire')}
        >
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text style={styles.ctaButtonText}>Start Quiz</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    // </SwipeBackWrapper>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 42 },
  hero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  greeting: { fontSize: 20, fontWeight: '700', marginTop: 12 },
  headline: { fontSize: 28, fontWeight: '800', marginTop: 4, lineHeight: 34 },
  subtitle: { fontSize: 14, marginTop: 8 },
  sparklesRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  spark: { width: 14, height: 14, borderRadius: 10 },
  suggestions: { marginTop: 0 },
  suggestionText: { fontSize: 0 },
  quickRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickChip: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quickIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '700' },
  showcaseCard: { marginTop: 16, borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  showcaseArt: { position: 'absolute', right: -20, top: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: '#ffffff22' },
  showcaseArtSm: { position: 'absolute', right: 30, bottom: -10, width: 60, height: 60, borderRadius: 30, backgroundColor: '#ffffff18' },
  showcaseTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  showcaseSubtitle: { color: '#fff', opacity: 0.9, fontSize: 13, marginTop: 6 },
  showcaseBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  showcaseBtnText: { color: '#fff', fontWeight: '800' },
  ctaCard: {
    marginTop: 18,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ctaTitle: { fontSize: 16, fontWeight: '800' },
  ctaSubtitle: { fontSize: 13, marginTop: 6 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ctaButtonText: { color: '#fff', fontWeight: '800' },
})


