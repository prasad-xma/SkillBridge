import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { useFocusEffect } from '@react-navigation/native'
import { ProgressChart } from 'react-native-chart-kit'

export default function ProgressScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [updatingId, setUpdatingId] = useState(null)

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

  const total = items.length
  const completed = useMemo(() => items.filter(i => !!i.completed).length, [items])
  const percent = total > 0 ? completed / total : 0

  const toggleCompleted = async (item) => {
    if (!item?.id) return
    try {
      setUpdatingId(item.id)
      const next = !item.completed
      await axios.patch(`${API_BASE}/api/purchases/${encodeURIComponent(item.id)}`, { completed: next })
      setItems(prev => prev.map(p => p.id === item.id ? { ...p, completed: next } : p))
    } catch (e) {
    } finally {
      setUpdatingId(null)
    }
  }

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
        <Text style={[styles.header, { color: theme.text }]}>Progress</Text>
        <TouchableOpacity onPress={fetchPurchases} disabled={loading} style={[styles.refreshBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="refresh" size={16} color={theme.text} />
          <Text style={[styles.refreshText, { color: theme.text }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Completed {completed} of {total}</Text>
        <ProgressChart
          data={{ data: [percent] }}
          width={Math.max(180, Dimensions.get('window').width - 64)}
          height={160}
          strokeWidth={10}
          radius={40}
          chartConfig={{
            backgroundGradientFrom: theme.card,
            backgroundGradientTo: theme.card,
            color: (opacity = 1) => `${theme.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
            labelColor: () => theme.text,
          }}
          hideLegend={false}
        />
      </View>

      <View style={styles.list}>
        {items.map((p) => {
          const checked = !!p.completed
          return (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => toggleCompleted(p)} style={[styles.todoItem, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <View style={[styles.checkbox, { borderColor: checked ? theme.accent : theme.border, backgroundColor: checked ? theme.accent + '22' : 'transparent' }]}> 
                {updatingId === p.id ? (
                  <ActivityIndicator size="small" color={checked ? theme.accent : theme.textSecondary} />
                ) : (
                  <Ionicons name={checked ? 'checkmark' : 'ellipse-outline'} size={18} color={checked ? theme.accent : theme.textSecondary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.todoTitle, { color: theme.text }]} numberOfLines={1}>{p?.course?.courseName || 'Course'}</Text>
                <Text style={[styles.todoMeta, { color: theme.textSecondary }]} numberOfLines={1}>{checked ? 'Completed' : 'Incomplete'}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  header: { fontSize: 20, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  refreshText: { fontSize: 12, fontWeight: '700' },
  list: { gap: 10, marginTop: 12 },
  todoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  todoTitle: { fontSize: 15, fontWeight: '800' },
  todoMeta: { fontSize: 12, marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 14, padding: 12 },
  progressLabel: { fontSize: 12, marginBottom: 8 },
})
