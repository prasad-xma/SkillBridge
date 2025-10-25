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

  const deriveSkillTagsFromInterests = (answers) => {
    const tags = new Set()
    const interests = Array.isArray(answers?.interests) ? answers.interests : []
    const add = (arr) => arr.forEach(t => tags.add(t))
    interests.forEach((it) => {
      const k = String(it).toLowerCase()
      if (k.includes('web')) add(['HTML', 'CSS', 'JavaScript', 'React', 'Node.js'])
      else if (k.includes('mobile')) add(['React Native', 'Flutter', 'Swift', 'Kotlin'])
      else if (k.includes('data')) add(['Python', 'Pandas', 'NumPy', 'scikit-learn'])
      else if (k.includes('ai') || k.includes('ml')) add(['Python', 'TensorFlow', 'PyTorch', 'Machine Learning'])
      else if (k.includes('cloud')) add(['AWS', 'Docker', 'Kubernetes'])
      else if (k.includes('ui') || k.includes('ux') || k.includes('design')) add(['Figma', 'Wireframing', 'Prototyping'])
      else if (k.includes('security')) add(['Network Security', 'OWASP', 'Penetration Testing'])
      else if (k.includes('devops')) add(['Docker', 'Kubernetes', 'Terraform', 'CI/CD'])
      else if (k.includes('product')) add(['User Stories', 'Roadmapping', 'Analytics'])
      else if (k.includes('marketing')) add(['SEO', 'Content Marketing', 'Google Analytics'])
      else if (k.includes('finance')) add(['Excel', 'Accounting', 'Financial Modeling'])
    })
    return Array.from(tags).slice(0, 16)
  }

  const tryLoadSkillTagsFromQuestionnaire = async (session) => {
    const identity = getIdentity(session)
    if (!identity) return
    try {
      const res = await axios.get(`${API_BASE}/api/student/questionnaire?${identity.query}`)
      const answers = res?.data?.answers || res?.data
      const derived = deriveSkillTagsFromInterests(answers)
      if (derived?.length) {
        setData((prev) => ({ ...(prev || {}), skillTags: derived }))
      }
    } catch (_) {
      // ignore
    }
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
      payload.includeTags = true
      const response = await axios.post(`${API_BASE}/api/recommend-skills`, payload)
      setData(response.data)
      setNeedsQuestionnaire(false)
      if (!Array.isArray(response?.data?.skillTags) || response.data.skillTags.length === 0) {
        await tryLoadSkillTagsFromQuestionnaire(session)
      }
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
      const response = await axios.get(`${API_BASE}/api/recommendations?${identity.query}&includeTags=1`)
      const rec = response.data
      setData(rec)
      if (rec?.isStale) {
        await regenerate(session, true)
      } else {
        setLoading(false)
      }
      if (!Array.isArray(rec?.skillTags) || rec.skillTags.length === 0) {
        await tryLoadSkillTagsFromQuestionnaire(session)
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
  const skillTags = Array.isArray(data?.skillTags)
    ? data.skillTags
    : skills.map(s => s?.name).filter(Boolean).slice(0, 10)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.contentContainer, { paddingBottom: 48, paddingTop: 40 }]}
    >
      <LinearGradient
        colors={[theme.heroFrom, theme.heroTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, { borderColor: theme.heroAccent + '33' }]}
      >
        <View style={[styles.heroAccentBubble, { backgroundColor: theme.heroAccent + '22' }]} />
        <View style={styles.heroRow}>
          <View style={[styles.heroIconWrap, { backgroundColor: theme.badgeGlow + '33', shadowColor: '#00000033' }]}> 
            <Ionicons name="sparkles" size={22} color={theme.heroAccent} />
          </View>
          <Text style={styles.heroTitle}>Your Personalized Path</Text>
        </View>
        <TouchableOpacity
          disabled={generating}
          onPress={() => regenerate(user, true)}
          style={[styles.refreshBtn, { backgroundColor: theme.primary + 'EE', shadowColor: theme.heroAccent + '44' }]}
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

      {(skillTags?.length || 0) > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsRow}>
          {skillTags.map((tag, idx) => (
            <View
              key={`tag-${idx}`}
              style={[
                styles.chip,
                {
                  backgroundColor: idx % 2 === 0 ? theme.skillCardBg : theme.skillCardBgAlt,
                  borderColor: theme.skillCardBorder,
                },
              ]}
            >
              <Ionicons name="pricetag-outline" size={14} color={theme.heroAccent} />
              <Text style={[styles.chipText, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">
                {String(tag)}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

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
              <View style={[styles.metaCard, { backgroundColor: theme.secondarySurface, borderColor: theme.border }]}> 
                <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Last generated</Text>
                  <Text style={[styles.metaValue, { color: theme.text }]}>{generatedAt ? new Date(generatedAt).toLocaleString() : 'Just now'}</Text>
                </View>
                {stale && (
                  <View style={[styles.badge, { backgroundColor: theme.heroAccent + '22', borderColor: theme.heroAccent + '55' }]}> 
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
                    <View
                      key={`${s?.name || 'skill'}-${idx}`}
                      style={[
                        styles.skillCard,
                        {
                          backgroundColor: idx % 2 === 0 ? theme.skillCardBg : theme.skillCardBgAlt,
                          borderColor: theme.skillCardBorder,
                          shadowColor: theme.primary + '22',
                        },
                      ]}
                    >
                      <View style={styles.skillHeader}>
                        <View style={[styles.skillBadge, { backgroundColor: theme.heroAccent + '22', borderColor: theme.heroAccent + '55' }]}> 
                          <Ionicons name="flash" color={theme.heroAccent} size={14} />
                        </View>
                        <Text style={[styles.skillTitle, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{s?.name || 'Skill'}</Text>
                      </View>
                      <Text style={[styles.skillWhy, { color: theme.textSecondary }]}>{s?.why || ''}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Text style={[styles.title, { color: theme.text, marginTop: 12 }]}>Advice</Text>
              <LinearGradient
                colors={[theme.adviceGradientFrom, theme.adviceGradientTo]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.adviceCard, { borderColor: theme.adviceBorder }]}
              >
                <View style={[styles.adviceIconWrap, { backgroundColor: theme.badgeGlow + '22' }]}> 
                  <Ionicons name="chatbubbles" size={16} color={theme.heroAccent} />
                </View>
                <Text style={[styles.adviceText, { color: theme.text }]}>{advice || 'Personalized advice will appear here.'}</Text>
              </LinearGradient>

              {questionnaireUpdatedAt && (
                <View style={[styles.metaCard, { backgroundColor: theme.secondarySurface, borderColor: theme.border, marginTop: 14 }]}> 
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
  contentContainer: { paddingHorizontal: 16 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 10 },
  subtitle: { fontSize: 14 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
    shadowColor: '#00000022',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  heroAccentBubble: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -40,
    top: -40,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, minWidth: 0 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', flexShrink: 1, minWidth: 0 },
  heroSubtitle: { color: '#fff', opacity: 0.9, marginTop: 6, fontSize: 13 },
  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
    flexDirection: 'row',
    gap: 6,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  refreshText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  tagsRow: { paddingVertical: 6, paddingRight: 8, gap: 8, marginBottom: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 180,
  },
  chipText: { fontSize: 12, fontWeight: '700' },
  adviceCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#0f172a22',
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  adviceText: { fontSize: 14, lineHeight: 20, flex: 1, flexWrap: 'wrap' },
  emptyCard: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  emptyText: { fontSize: 13, flex: 1, flexWrap: 'wrap' },
  adviceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { gap: 14 },
  skillCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  skillHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  skillBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  skillTitle: { fontSize: 16, fontWeight: '800', flexShrink: 1, minWidth: 0 },
  skillWhy: { fontSize: 13, lineHeight: 18, flexShrink: 1, flexWrap: 'wrap' },
  metaCard: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 12 },
  metaLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
  metaValue: { fontSize: 13, fontWeight: '700' },
  ctaBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  ctaBtnText: { color: '#fff', fontWeight: '800' }
})
