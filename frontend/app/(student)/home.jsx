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

  const renderProfileField = (label, value) => {
    if (!value && value !== 0) return null
    return (
      <View style={styles.row}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>Your Dashboard</Text>
        {user ? (
          <View>
            {renderProfileField('Name', user.fullName)}
            {renderProfileField('Email', user.email)}
            {renderProfileField('Role', user.role)}
            {user.profile ? (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
                {Object.entries(user.profile).map(([k, v]) => (
                  <View key={k} style={styles.row}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{k}</Text>
                    <Text style={[styles.fieldValue, { color: theme.text }]}>{String(v)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : (
          <Text style={{ color: theme.textSecondary }}>Loading your details…</Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { borderRadius: 12, borderWidth: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  fieldLabel: { fontSize: 14 },
  fieldValue: { fontSize: 14, fontWeight: '600' },
})


