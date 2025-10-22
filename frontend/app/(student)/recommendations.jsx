import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'

export default function RecommendationsScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [needsQuestionnaire, setNeedsQuestionnaire] = useState(false)

  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'student') {
        router.replace('/login')
        return
      }
      setUser(session)
      await loadRecommendations(session)
    })()
  }, [])

  const getIdentity = (session) => {
    if (session?.uid) {
      return {
        query: `userId=${encodeURIComponent(session.uid)}`,
        payload: { userId: session.uid },
      }
    }
    if (session?.email) {
      return {
        query: `email=${encodeURIComponent(session.email)}`,
        payload: { email: session.email },
      }
    }
    return null
  }

  const regenerate = async (session, force = false) => {
    const identity = getIdentity(session)
    if (!identity) {
      setError('Missing user identity')
      setLoading(false)
      return
    }
    try {
      setGenerating(true)
      setError(null)
      const payload = { ...identity.payload }
      if (force) payload.force = true
      const response = await axios.post(`${API_BASE}/api/recommend-skills`, payload)
      setData(response.data)
      setNeedsQuestionnaire(false)
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Failed to generate recommendations'
      if (err?.response?.status === 404 && message.toLowerCase().includes('questionnaire')) {
        setNeedsQuestionnaire(true)
      }
      setError(message)
    } finally {
      setGenerating(false)
      setLoading(false)
    }
  }

  const loadRecommendations = async (session) => {
    const identity = getIdentity(session)
    if (!identity) {
      setError('Missing user identity')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      setNeedsQuestionnaire(false)
      const response = await axios.get(`${API_BASE}/api/recommendations?${identity.query}`)
      const rec = response.data
      setData(rec)
      if (rec?.isStale) {
        await regenerate(session, true)
      } else {
        setLoading(false)
      }
    } catch (err) {
      const status = err?.response?.status
      const message = err?.response?.data?.message || err?.message || 'Failed to load recommendations'
      if (status === 404) {
        if (message.toLowerCase().includes('questionnaire')) {
          setNeedsQuestionnaire(true)
          setLoading(false)
          return
        }
        await regenerate(session)
        return
      }
      setError(message)
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}> 
        <ActivityIndicator />
      </View>
    )
  }

  const skills = Array.isArray(data?.skills) ? data.skills : []
  const advice = typeof data?.advice === 'string' ? data.advice : ''
  const generatedAt = data?.generatedAt
  const questionnaireUpdatedAt = data?.questionnaireUpdatedAt
  const stale = Boolean(data?.isStale)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <LinearGradient colors={[theme.heroFrom, theme.heroTo]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="sparkles" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Your Personalized Path</Text>
          <Text style={styles.heroSubtitle}>Curated insights for {user.fullName || 'you'}</Text>
        </View>
        <TouchableOpacity
          disabled={generating}
          onPress={() => regenerate(user, true)}
          style={[styles.refreshBtn, { backgroundColor: theme.primary + 'EE' }]}
        >
          {generating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.refreshText}>Regenerate</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {needsQuestionnaire ? (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <Ionicons name="clipboard-outline" size={20} color={theme.textSecondary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>Complete your questionnaire</Text>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>We need your latest interests and goals before generating recommendations.</Text>
          </View>
          <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: theme.primary }]} onPress={() => router.push('/(student)/questionnaire')}>
            <Text style={styles.ctaBtnText}>Start</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {error ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <Ionicons name="warning-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>{error}</Text>
            </View>
          ) : (
            <>
              <View style={[styles.metaCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Last generated</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>{generatedAt ? new Date(generatedAt).toLocaleString() : 'Just now'}</Text>
                </View>
                {stale && (
                  <View style={[styles.badge, { backgroundColor: theme.accent + '22', borderColor: theme.accent + '55' }]}> 
                    <Text style={[styles.badgeText, { color: theme.accent }]}>Needs refresh</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.title, { color: theme.text }]}>Recommended Skills</Text>
              {skills.length === 0 ? (
                <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                  <Ionicons name="information-circle" size={18} color={theme.textSecondary} />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No recommendations yet. Try regenerating.</Text>
                </View>
              ) : (
                <View style={styles.grid}>
                  {skills.map((s, idx) => (
                    <View key={`${s?.name || 'skill'}-${idx}`} style={[styles.skillCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                      <View style={styles.skillHeader}>
                        <View style={[styles.badge, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '33' }]}>
                          <Ionicons name="flash" color={theme.primary} size={14} />
                        </View>
                        <Text style={[styles.skillTitle, { color: theme.text }]}>{s?.name || 'Skill'}</Text>
                      </View>
                      <Text style={[styles.skillWhy, { color: theme.textSecondary }]}>{s?.why || ''}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.title, { color: theme.text, marginTop: 12 }]}>Advice</Text>
              <View style={[styles.adviceCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                <Ionicons name="chatbubbles" size={16} color={theme.textSecondary} />
                <Text style={[styles.adviceText, { color: theme.text }]}>{advice || 'Personalized advice will appear here.'}</Text>
              </View>

              {questionnaireUpdatedAt && (
                <View style={[styles.metaCard, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: 14 }]}> 
                  <Ionicons name="create-outline" size={16} color={theme.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Questionnaire last updated</Text>
                    <Text style={[styles.metaValue, { color: theme.text }]}>{new Date(questionnaireUpdatedAt).toLocaleString()}</Text>
                  </View>
                </View>
              )}
            </>
          )}
        </>
      )}
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
  refreshBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  refreshText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  adviceCard: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 8 },
  adviceText: { fontSize: 14, lineHeight: 20 },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  grid: { gap: 12 },
  skillCard: { borderWidth: 1, borderRadius: 14, padding: 14 },
  skillHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  skillTitle: { fontSize: 16, fontWeight: '800' },
  skillWhy: { fontSize: 13, lineHeight: 18 },
  metaCard: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  metaLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  metaValue: { fontSize: 13, fontWeight: '700' },
  ctaBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  ctaBtnText: { color: '#fff', fontWeight: '800' }
})
