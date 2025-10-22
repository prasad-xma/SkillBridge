import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function Reminders() {
  const [user, setUser] = useState(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const scheme = useColorScheme()
  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
    })()
  }, [])

  const onSetReminder = async () => {
    if (!user?.uid) return
    setLoading(true)
    setMessage('')
    try {
      const res = await axios.post(`${API_BASE}/api/mentor/reminder/set`, { mentorId: user.uid, when: new Date().toISOString(), note: 'Follow up' })
      setMessage(res?.data?.message || 'Reminder set')
    } catch (e) {
      setMessage(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroAccent} />
        <Text style={styles.heroTitle}>Reminders</Text>
        <Text style={styles.heroSub}>Create quick follow-ups</Text>
      </View>
      <View style={[styles.card, styles.cardBlue]}>
        <Text style={styles.cardTitle}>Actions</Text>
        <TouchableOpacity onPress={onSetReminder} style={styles.primaryBtn} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Saving...' : 'Set Sample Reminder'}</Text>
        </TouchableOpacity>
        {message ? <Text style={styles.meta}>{message}</Text> : null}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  hero: { position: 'relative', padding: 16, paddingTop: 18, marginBottom: 10, backgroundColor: '#e0f2fe', borderRadius: 16, overflow: 'hidden' },
  heroAccent: { position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 9999, backgroundColor: '#bae6fd' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#0ea5e9' },
  heroSub: { color: '#0369a1', marginTop: 4 },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 14, backgroundColor: '#ffffff', borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardBlue: { borderColor: '#bfdbfe', backgroundColor: '#f8fbff' },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10, color: '#0f172a' },
  primaryBtn: { paddingVertical: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#3b82f6' },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 10 },
})
