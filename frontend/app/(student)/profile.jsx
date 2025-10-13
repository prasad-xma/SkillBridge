import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession, clearSession } from '../../lib/session'
import { router } from 'expo-router'

export default function StudentProfile() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
    })()
  }, [])

  const onLogout = async () => {
    await clearSession()
    router.replace('/login')
  }

  const initials = useMemo(() => {
    const name = user?.fullName || ''
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'ST'
  }, [user?.fullName])

  const renderField = (label, value) => {
    if (!value && value !== 0) return null
    return (
      <View style={styles.row}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text>
      </View>
    )
  }

  const profile = user?.profile || {}

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.avatar, { backgroundColor: theme.tint + '22', borderColor: theme.tint + '44' }]}>
          <Text style={[styles.avatarText, { color: theme.tint }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName || 'Student'}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || '—'}</Text>
        </View>
      </View>

      <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        {renderField('Role', user?.role)}
        {renderField('Email', user?.email)}

        {Object.keys(profile).length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
            {Object.entries(profile).map(([key, val]) => (
              <View key={key} style={styles.row}>
                <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text>
                <Text style={[styles.fieldValue, { color: theme.text }]}>{String(val)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onLogout}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 42 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 2 },

  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  fieldLabel: { fontSize: 13 },
  fieldValue: { fontSize: 13, fontWeight: '700' },

  button: { marginTop: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})


