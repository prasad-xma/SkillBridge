import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ScrollView, ActivityIndicator, Image, TouchableOpacity } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import Ionicons from '@expo/vector-icons/Ionicons'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { useFocusEffect } from '@react-navigation/native'

export default function PurchasedScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])

  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

  const fetchPurchases = async () => {
    try {
      const s = await getSession()
      setUser(s)
      if (!s?.uid) {
        setItems([])
        return
        }
      const res = await axios.get(`${API_BASE}/api/purchases/${encodeURIComponent(s.uid)}`)
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (e) {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      setLoading(true)
      fetchPurchases()
      return undefined
    }, [])
  )

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}> 
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, { color: theme.text }]}>Purchased Courses</Text>
        <TouchableOpacity onPress={fetchPurchases} disabled={loading} style={[styles.refreshBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="refresh" size={16} color={theme.text} />
          <Text style={[styles.refreshText, { color: theme.text }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
      {items.length === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No purchases yet</Text>
      ) : (
        <View style={styles.list}>
          {items.map((p) => (
            <View key={p.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <View style={styles.thumbWrap}>
                {p.course?.thumbnailUrl ? (
                  <Image source={{ uri: p.course.thumbnailUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: theme.secondarySurface, alignItems: 'center', justifyContent: 'center' }]}> 
                    <Ionicons name="image" size={18} color={theme.textSecondary} />
                  </View>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>{p.course?.courseName || 'Course'}</Text>
                <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
                  {p.course?.category} • {p.course?.difficulty} • {p.course?.duration}
                </Text>
                <View style={styles.row}>
                  <View style={[styles.badge, { borderColor: theme.border }]}> 
                    <Ionicons name={p.completed ? 'checkmark-circle' : 'time-outline'} size={14} color={theme.textSecondary} />
                    <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{p.completed ? 'Completed' : 'Incomplete'}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  list: { gap: 10 },
  card: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 14, padding: 10 },
  thumbWrap: { width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  title: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 12, marginTop: 4 },
  empty: { fontSize: 13 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  refreshText: { fontSize: 12, fontWeight: '700' },
})
