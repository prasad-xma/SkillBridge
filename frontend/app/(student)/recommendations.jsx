import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'

export default function RecommendationsScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [error, setError] = useState(null)

  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const response = await axios.post(`${API_BASE}/api/recommend-skills`)
        setText(response?.data?.text || '')
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to fetch Gemini response')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}> 
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="sparkles" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Gemini Test Output</Text>
          <Text style={styles.heroSubtitle}>Temporary preview of Gemini response</Text>
        </View>
      </LinearGradient>

      <Text style={[styles.title, { color: theme.text }]}>Response</Text>
      <View style={[styles.adviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Ionicons name="chatbubbles" size={16} color={theme.textSecondary} />
        <Text style={[styles.adviceText, { color: theme.text }]}>{error ? `Error: ${error}` : text || 'No response received.'}</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 42 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 14 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  heroSubtitle: { color: '#fff', opacity: 0.9, marginTop: 4, fontSize: 13 },
  adviceCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  adviceText: { fontSize: 14, lineHeight: 20 },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  emptyText: { fontSize: 13 }
})
