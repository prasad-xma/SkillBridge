import React, { useEffect, useState } from 'react'
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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      {user ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: theme.textSecondary }}>Name: {user.fullName}</Text>
          <Text style={{ color: theme.textSecondary }}>Email: {user.email}</Text>
          <Text style={{ color: theme.textSecondary }}>Role: {user.role}</Text>
        </View>
      ) : (
        <Text style={{ color: theme.textSecondary }}>Loading...</Text>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onLogout}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Logout</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  button: { marginTop: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})


