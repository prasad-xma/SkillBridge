import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession, clearSession } from '../../lib/session'
import { router } from 'expo-router'

export default function StudentProfile() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)
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
    })()
  }, [])

  const onLogout = async () => {
    await clearSession()
    router.replace('/login')
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <Text style={styles.heroTitle}>Profile</Text>
        <Text style={styles.heroSub}>Your account information</Text>
      </View>

      <View style={[styles.card, styles.cardBlue]}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'U'}</Text></View>
          <View style={{ flex: 1 }} />
        </View>
        <Text style={styles.cardTitle}>Details</Text>
        {user ? (
          <View style={{ gap: 16 }}>
            <Text style={styles.meta}>Name: {user.fullName}</Text>
            <Text style={styles.meta}>Email: {user.email}</Text>
            <Text style={styles.meta}>Role: {user.role}</Text>
          </View>
        ) : (
          <Text style={styles.meta}>Loading...</Text>
        )}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onLogout}>
        <Text style={styles.primaryBtnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  hero: { position: 'relative', padding: 16, paddingTop: 18, marginBottom: 10, backgroundColor: '#e0f2fe', borderRadius: 16, overflow: 'hidden' },
  heroAccent: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 9999, backgroundColor: '#bae6fd' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#0ea5e9' },
  heroSub: { color: '#0369a1', marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 14, backgroundColor: '#ffffff', borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardBlue: { borderColor: '#bfdbfe', backgroundColor: '#f8fbff' },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10, color: '#0f172a' },
  meta: { color: '#64748b' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#bfdbfe' },
  avatarText: { color: '#2563eb', fontWeight: '800', fontSize: 18 },
  primaryBtn: { marginTop: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#3b82f6' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
})


