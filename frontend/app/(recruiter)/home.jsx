import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'
import { themes } from '../../constants/colors'

export default function RecruiterHome() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      setUser(session)
    })()
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome back!</Text>
        <Text style={[styles.name, { color: theme.text }]}>{user?.fullName || 'Recruiter'}</Text>
        <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || '—'}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 42,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
  },
  email: {
    fontSize: 14,
  },
})
