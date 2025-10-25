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
import { router } from 'expo-router'

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
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.container, { paddingTop: (Constants?.statusBarHeight || 0) + 8 }]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.push('/(student)/courses')} style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: theme.text }]}>Progress</Text>
        <TouchableOpacity onPress={fetchPurchases} disabled={loading} style={[styles.refreshBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}>
          <Ionicons name="refresh" size={16} color={theme.text} />
          <Text style={[styles.refreshText, { color: theme.text }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '33' }]}>
            <Ionicons name="stats-chart-outline" size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Learning Progress</Text>
            <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Completed {completed} of {total}</Text>
          </View>
        </View>
        <View style={styles.chartWrap}>
          <ProgressChart
            data={{ data: [percent] }}
            width={Math.max(220, Dimensions.get('window').width - 64)}
            height={170}
            strokeWidth={12}
            radius={42}
            chartConfig={{
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              color: (opacity = 1) => `${theme.primary}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
              labelColor: () => theme.textSecondary,
            }}
            hideLegend
          />
          <View pointerEvents="none" style={styles.chartCenter}>
            <Text style={[styles.percentText, { color: theme.text }]}>{Math.round(percent * 100)}%</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.legendItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Completed</Text>
          </View>
          <View style={[styles.legendItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.legendDot, { backgroundColor: theme.border }]} />
            <Text style={[styles.legendText, { color: theme.textSecondary }]}>Remaining</Text>
          </View>
        </View>
        <View style={[styles.linearBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.linearFill, { backgroundColor: theme.primary, width: `${Math.round(percent * 100)}%` }]} />
        </View>
      </View>

      <View style={styles.list}>
        {items.map((p) => {
          const checked = !!p.completed
          const diff = (p?.course?.difficulty || '').toLowerCase()
          const stripeColor = diff.includes('beginner') ? theme.accent : diff.includes('advanced') ? theme.primary : theme.tint
          return (
            <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => toggleCompleted(p)} style={[styles.todoItem, { backgroundColor: theme.card, borderColor: theme.border, borderLeftWidth: 4, borderLeftColor: stripeColor }]}> 
              <View style={[styles.checkbox, { borderColor: checked ? theme.accent : theme.border, backgroundColor: checked ? theme.accent + '22' : 'transparent' }]}> 
                {updatingId === p.id ? (
                  <ActivityIndicator size="small" color={checked ? theme.accent : theme.textSecondary} />
                ) : (
                  <Ionicons name={checked ? 'checkmark' : 'ellipse-outline'} size={18} color={checked ? theme.accent : theme.textSecondary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.todoTitle, { color: theme.text }]} numberOfLines={1}>{p?.course?.courseName || 'Course'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  {!!p?.course?.category && (
                    <View style={[styles.metaBadge, { borderColor: stripeColor + '55', backgroundColor: stripeColor + '14' }]}> 
                      <Ionicons name="pricetag-outline" size={12} color={stripeColor} />
                      <Text style={[styles.metaBadgeText, { color: stripeColor }]} numberOfLines={1}>{p.course.category}</Text>
                    </View>
                  )}
                  <View style={[styles.metaBadge, { borderColor: theme.border, backgroundColor: theme.surface }]}> 
                    <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                    <Text style={[styles.metaBadgeText, { color: theme.textSecondary }]} numberOfLines={1}>{p?.course?.duration || '—'}</Text>
                  </View>
                  <View style={[styles.metaBadge, { borderColor: checked ? theme.accent + '55' : theme.border, backgroundColor: checked ? theme.accent + '14' : theme.surface }]}> 
                    <Ionicons name={checked ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={checked ? theme.accent : theme.textSecondary} />
                    <Text style={[styles.metaBadgeText, { color: checked ? theme.accent : theme.textSecondary }]}>{checked ? 'Completed' : 'Incomplete'}</Text>
                  </View>
                </View>
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  header: { fontSize: 20, fontWeight: '800' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  refreshText: { fontSize: 12, fontWeight: '700' },
  list: { gap: 12, marginTop: 12 },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 1,
  },
  checkbox: { width: 26, height: 26, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  todoTitle: { fontSize: 15, fontWeight: '800' },
  todoMeta: { fontSize: 12, marginTop: 2 },
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  progressLabel: { fontSize: 12, marginBottom: 8 },
})
