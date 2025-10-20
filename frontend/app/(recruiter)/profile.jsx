import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession, clearSession } from '../../lib/session'
import { router } from 'expo-router'

export default function RecruiterProfile() {
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
      .join('') || 'RC'
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
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName || 'Recruiter'}</Text>
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || '—'}</Text>
          {user?.role ? (
            <View style={[styles.roleChip, { borderColor: theme.accent + '66', backgroundColor: theme.accent + '14' }]}>
              <View style={[styles.roleDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.roleText, { color: theme.accent }]}>{String(user.role).toUpperCase()}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>
        <View style={styles.divider} />
        {renderField('Email', user?.email)}
        {renderField('Role', user?.role)}

        {Object.keys(profile).length > 0 ? (
          <View style={{ marginTop: 18 }}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
            <View style={styles.divider} />
            {Object.entries(profile).map(([key, val]) => {
              const value = Array.isArray(val) ? val.filter(Boolean) : val
              if (Array.isArray(value) && value.length > 0) {
                return (
                  <View key={key} style={styles.row}>
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text>
                    <View style={styles.chipsRow}>
                      {value.map((item, idx) => (
                        <View key={idx} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                          <Text style={[styles.chipText, { color: theme.text }]}>{String(item)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              }
              return (
                <View key={key} style={styles.row}>
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text>
                  <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text>
                </View>
              )
            })}
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
  roleChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
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
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: '#00000011', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  fieldLabel: { fontSize: 13 },
  fieldValue: { fontSize: 13, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, maxWidth: '60%', justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 12 },
  button: { marginTop: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})
