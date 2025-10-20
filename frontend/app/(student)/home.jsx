import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
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

      <View style={styles.suggestions}>
        <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>Start by checking your courses or browse recommendations.</Text>
      </View>
    </View>
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
  suggestions: { marginTop: 18 },
  suggestionText: { fontSize: 13 },
})


