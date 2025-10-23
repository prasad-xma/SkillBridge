import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'

export default function CoursesScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [skills, setSkills] = useState([])
  const [answers, setAnswers] = useState(null)
  const [query, setQuery] = useState('')
  const [expandedCourses, setExpandedCourses] = useState({})
  const [expandedSkills, setExpandedSkills] = useState({})

  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

  const normalize = (s) => (s || '').toString().toLowerCase()

  const scoreCourse = (course, ans) => {
    if (!course || !ans) return 0
    let score = 0
    const domain = normalize(ans.domain)
    const interests = Array.isArray(ans.interests) ? ans.interests.map(normalize) : []
    const name = normalize(course.courseName)
    const desc = normalize(course.description)
    const cat = normalize(course.category)
    if (domain && cat === domain) score += 3
    interests.forEach((i) => {
      if (!i) return
      if (cat.includes(i)) score += 2
      if (name.includes(i)) score += 1
      if (desc.includes(i)) score += 1
    })
    return score
  }

  const fetchAll = async () => {
    try {
      const s = await getSession()
      setUser(s)
      const idQuery = s?.uid ? `uid=${encodeURIComponent(s.uid)}` : s?.email ? `email=${encodeURIComponent(s.email)}` : ''
      const results = await Promise.allSettled([
        axios.get(`${API_BASE}/courses`),
        axios.get(`${API_BASE}/skills`),
        idQuery ? axios.get(`${API_BASE}/api/student/questionnaire?${idQuery}`) : Promise.resolve({ data: null }),
      ])
      const [coursesRes, skillsRes, qRes] = results
      setCourses(coursesRes.status === 'fulfilled' && Array.isArray(coursesRes.value?.data) ? coursesRes.value.data : [])
      setSkills(skillsRes.status === 'fulfilled' && Array.isArray(skillsRes.value?.data) ? skillsRes.value.data : [])
      setAnswers(qRes.status === 'fulfilled' ? (qRes.value?.data?.answers || null) : null)
    } catch (e) {
      setCourses([])
      setSkills([])
      setAnswers(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const recommendedCourses = useMemo(() => {
    if (!answers || !Array.isArray(courses)) return []
    const scored = courses
      .map((c) => ({ item: c, score: scoreCourse(c, answers) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item)
    return scored
  }, [courses, answers])

  const filterQuery = (text, q) => normalize(text).includes(normalize(q))
  const courseMatches = (c, q) => {
    if (!q) return true
    return (
      filterQuery(c.courseName, q) ||
      filterQuery(c.description, q) ||
      filterQuery(c.category, q) ||
      filterQuery(c.difficulty, q)
    )
  }
  const skillMatches = (s, q) => {
    if (!q) return true
    return (
      filterQuery(s.skillName, q) ||
      filterQuery(s.description, q) ||
      filterQuery(s.category, q) ||
      filterQuery(s.difficulty, q)
    )
  }

  const recommendedFiltered = useMemo(() => recommendedCourses.filter((c) => courseMatches(c, query)), [recommendedCourses, query])
  const allCoursesFiltered = useMemo(() => courses.filter((c) => courseMatches(c, query)), [courses, query])
  const allSkillsFiltered = useMemo(() => skills.filter((s) => skillMatches(s, query)), [skills, query])

  const toggleCourse = (id) => setExpandedCourses((prev) => ({ ...prev, [id]: !prev[id] }))
  const toggleSkill = (id) => setExpandedSkills((prev) => ({ ...prev, [id]: !prev[id] }))

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: theme.background }]}> 
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={[styles.header, { color: theme.text }]}>Explore Courses & Skills</Text>

      <View style={[styles.searchWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search courses or skills"
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query ? (
          <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {recommendedFiltered.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}> 
            <View style={[styles.sectionIcon, { backgroundColor: theme.primary + '1A', borderColor: theme.primary + '33' }]}> 
              <Ionicons name="sparkles" size={16} color={theme.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recommended for you</Text>
          </View>
          <View style={styles.list}>
            {recommendedFiltered.map((c) => (
              <CourseCard key={c.id} theme={theme} course={c} expanded={!!expandedCourses[c.id]} onToggle={() => toggleCourse(c.id)} />
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeader}> 
          <View style={[styles.sectionIcon, { backgroundColor: theme.tint + '1A', borderColor: theme.tint + '33' }]}> 
            <Ionicons name="book-outline" size={16} color={theme.tint} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>All Courses</Text>
        </View>
        {allCoursesFiltered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No courses found</Text>
        ) : (
          <View style={styles.list}>
            {allCoursesFiltered.map((c) => (
              <CourseCard key={c.id} theme={theme} course={c} expanded={!!expandedCourses[c.id]} onToggle={() => toggleCourse(c.id)} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}> 
          <View style={[styles.sectionIcon, { backgroundColor: theme.accent + '1A', borderColor: theme.accent + '33' }]}> 
            <Ionicons name="flash-outline" size={16} color={theme.accent} />
          </View>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills</Text>
        </View>
        {allSkillsFiltered.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No skills found</Text>
        ) : (
          <View style={styles.skillList}>
            {allSkillsFiltered.map((s) => (
              <SkillCard key={s.id} theme={theme} skill={s} expanded={!!expandedSkills[s.id]} onToggle={() => toggleSkill(s.id)} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const CourseCard = ({ theme, course, expanded, onToggle }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
      <View style={styles.cardLeft}>
        {course.thumbnailUrl ? (
          <Image source={{ uri: course.thumbnailUrl }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: theme.secondarySurface, alignItems: 'center', justifyContent: 'center' }]}> 
            <Ionicons name="image" size={18} color={theme.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.cardRight}>
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{course.courseName}</Text>
          <View style={[styles.badge, { backgroundColor: theme.muted, borderColor: theme.border }]}> 
            <Text style={[styles.badgeText, { color: theme.textSecondary }]} numberOfLines={1}>{course.category}</Text>
          </View>
        </View>
        <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={expanded ? 4 : 2}>{course.description}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="barbell-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{course.difficulty}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.metaText, { color: theme.textSecondary }]}>{course.duration}</Text>
          </View>
          {course.fees ? (
            <View style={styles.metaChip}>
              <Ionicons name="cash-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.metaText, { color: theme.textSecondary }]}>{course.fees}</Text>
            </View>
          ) : null}
        </View>
        {expanded ? (
          <View style={styles.detailBlock}>
            {Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0 ? (
              <View style={styles.detailRow}>
                <Ionicons name="list-circle-outline" size={16} color={theme.tint} />
                <Text style={[styles.detailTitle, { color: theme.text }]}>What you'll learn</Text>
              </View>
            ) : null}
            {Array.isArray(course.learningOutcomes) && course.learningOutcomes.length > 0 ? (
              <View style={styles.bulletWrap}>
                {course.learningOutcomes.slice(0, 4).map((it, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
                    <Text style={[styles.bulletText, { color: theme.textSecondary }]} numberOfLines={2}>{it}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.actionsRow}>
              <TouchableOpacity activeOpacity={0.9} style={[styles.buyBtn, { backgroundColor: theme.primary }]}> 
                <Ionicons name="cart" size={16} color="#fff" />
                <Text style={styles.buyBtnText}>Purchase</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  )
}

const SkillCard = ({ theme, skill, expanded, onToggle }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={[styles.skillCard, { backgroundColor: theme.skillCardBg, borderColor: theme.skillCardBorder }]}> 
      <View style={styles.skillIconWrap}> 
        <Ionicons name="flash" size={14} color={theme.tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.skillTitle, { color: theme.text }]} numberOfLines={1}>{skill.skillName}</Text>
        <Text style={[styles.skillMeta, { color: theme.textSecondary }]} numberOfLines={1}>{skill.category} • {skill.difficulty} • {skill.duration}</Text>
        {expanded ? (
          <Text style={[styles.skillDesc, { color: theme.textSecondary }]} numberOfLines={4}>{skill.description}</Text>
        ) : null}
      </View>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 20, fontWeight: '800', marginBottom: 12 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15, fontWeight: '600' },
  clearBtn: { padding: 4 },
  section: { marginTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  list: { gap: 10 },
  card: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 14, padding: 10 },
  cardLeft: { width: 64, height: 64 },
  thumb: { width: 64, height: 64, borderRadius: 10 },
  cardRight: { flex: 1 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', flex: 1 },
  cardDesc: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 0, paddingVertical: 0 },
  metaText: { fontSize: 12, fontWeight: '600' },
  empty: { fontSize: 13 },
  skillList: { gap: 10 },
  skillCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 10 },
  skillIconWrap: { width: 26, height: 26, borderRadius: 8, backgroundColor: '#ffffff44', alignItems: 'center', justifyContent: 'center' },
  skillTitle: { fontSize: 14, fontWeight: '800' },
  skillMeta: { fontSize: 12, marginTop: 2 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  detailBlock: { marginTop: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  detailTitle: { fontSize: 13, fontWeight: '800' },
  bulletWrap: { gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { fontSize: 12, flex: 1 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  buyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
  buyBtnText: { color: '#fff', fontWeight: '800' },
  skillDesc: { fontSize: 12, marginTop: 6 },
})
