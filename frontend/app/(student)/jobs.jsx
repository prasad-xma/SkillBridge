import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'

export default function StudentJobs() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [applyForm, setApplyForm] = useState({ resumeUrl: '', coverLetter: '' })

  const appliedJobMap = useMemo(() => {
    const map = {}
    applications.forEach((item) => {
      if (item?.jobId) map[item.jobId] = true
    })
    return map
  }, [applications])

  const getApiBase = () => ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE

  const loadJobs = useCallback(async () => {
    try {
      const API_BASE = getApiBase()
      if (!API_BASE) {
        Alert.alert('Configuration error', 'API_BASE is not set. Add it to frontend/.env or app.json')
        setJobs([])
        return
      }
      const resp = await axios.get(`${API_BASE}/api/student/jobs`)
      const list = Array.isArray(resp.data) ? resp.data : []
      setJobs(list)
    } catch (e) {
      Alert.alert('Failed to load jobs', e?.response?.data?.message || e?.message || 'Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadApplications = useCallback(async (uid) => {
    if (!uid) return
    try {
      const API_BASE = getApiBase()
      if (!API_BASE) return
      const resp = await axios.get(`${API_BASE}/api/student/applications`, { params: { uid } })
      const list = Array.isArray(resp.data) ? resp.data : []
      setApplications(list)
    } catch (e) {}
  }, [])

  useEffect(() => {
    ;(async () => {
      const session = await getSession()
      if (!session || session.role !== 'student') {
        router.replace('/login')
        return
      }
      setUser(session)
      setChecked(true)
      setLoading(true)
      await Promise.all([loadJobs(), loadApplications(session.uid)])
    })()
  }, [loadApplications, loadJobs])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadJobs()
    if (user?.uid) await loadApplications(user.uid)
  }, [loadApplications, loadJobs, user?.uid])

  const formatSkills = (input) => {
    if (Array.isArray(input)) return input
    if (typeof input === 'string') {
      return input
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return []
  }

  const onApply = useCallback(async () => {
    if (!selectedJob || !user?.uid) return
    const API_BASE = getApiBase()
    if (!API_BASE) {
      Alert.alert('Configuration error', 'API_BASE is not set. Add it to frontend/.env or app.json')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        uid: user.uid,
        name: user.fullName || user.email || 'Student',
        email: user.email || null,
        resumeUrl: applyForm.resumeUrl?.trim() || null,
        coverLetter: applyForm.coverLetter?.trim() || null,
        skills: formatSkills(selectedJob.skills),
      }
      await axios.post(`${API_BASE}/api/student/jobs/${selectedJob.id}/apply`, payload)
      Alert.alert('Application submitted', 'Your application has been sent to the recruiter.')
      setApplyForm({ resumeUrl: '', coverLetter: '' })
      await Promise.all([loadJobs(), loadApplications(user.uid)])
    } catch (e) {
      const status = e?.response?.status
      if (status === 409) {
        Alert.alert('Already applied', 'You have already applied for this job.')
      } else {
        Alert.alert('Failed to apply', e?.response?.data?.message || e?.message || 'Network error')
      }
    } finally {
      setSubmitting(false)
    }
  }, [applyForm.coverLetter, applyForm.resumeUrl, loadApplications, loadJobs, selectedJob, user])

  const hasApplied = selectedJob ? !!appliedJobMap[selectedJob.id] : false

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  const renderJobCard = ({ item }) => {
    const skills = formatSkills(item.skills)
    return (
      <TouchableOpacity
        style={[styles.jobCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.85}
        onPress={() => setSelectedJob(item)}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.jobTitle, { color: theme.text }]}>{item.title}</Text>
          {item.location ? (
            <Text style={[styles.jobSubtitle, { color: theme.textSecondary }]}>{item.location}</Text>
          ) : null}
          {item.experience ? (
            <Text style={[styles.jobSubtitle, { color: theme.textSecondary }]}>{item.experience}</Text>
          ) : null}
          <View style={styles.chipRow}>
            {skills.slice(0, 4).map((skill) => (
              <View key={skill} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={{ color: theme.tint, fontWeight: '700' }}>View</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.headerBar, { borderColor: theme.border }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Jobs</Text>
      </View>

      {!selectedJob ? (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.spinnerWrap}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No jobs yet</Text>
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8 }}>
                New opportunities will appear here once recruiters post roles.
              </Text>
            </View>
          ) : (
            <FlatList
              data={jobs}
              keyExtractor={(item) => item.id}
              renderItem={renderJobCard}
              contentContainerStyle={styles.listContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
            />
          )}
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={[styles.detailHeader, { borderColor: theme.border }]}> 
            <TouchableOpacity
              onPress={() => setSelectedJob(null)}
              style={[styles.backBtn, { borderColor: theme.border }]}
            >
              <Text style={{ color: theme.text }}>{'<'} Back</Text>
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedJob.title}</Text>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailBody}>
            {selectedJob.location ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Location</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{selectedJob.location}</Text>
              </View>
            ) : null}
            {selectedJob.category ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{selectedJob.category}</Text>
              </View>
            ) : null}
            {selectedJob.experience ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Experience</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{selectedJob.experience}</Text>
              </View>
            ) : null}

            <View style={{ marginTop: 16 }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills</Text>
              <View style={styles.chipRow}>
                {formatSkills(selectedJob.skills).map((skill) => (
                  <View key={skill} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600' }}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {selectedJob.description ? (
              <View style={{ marginTop: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
                <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{selectedJob.description}</Text>
              </View>
            ) : null}

            <View style={[styles.applyCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Apply</Text>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12 }}>
                Share a resume link and short note to strengthen your application.
              </Text>
              <TextInput
                value={applyForm.resumeUrl}
                onChangeText={(text) => setApplyForm((prev) => ({ ...prev, resumeUrl: text }))}
                placeholder="Resume or portfolio URL"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              />
              <TextInput
                value={applyForm.coverLetter}
                onChangeText={(text) => setApplyForm((prev) => ({ ...prev, coverLetter: text }))}
                placeholder="Cover letter or additional details"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                style={[styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              />
              <TouchableOpacity
                disabled={submitting || hasApplied}
                onPress={onApply}
                activeOpacity={0.9}
                style={[styles.applyBtn, { backgroundColor: hasApplied ? theme.border : theme.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.applyBtnText}>{hasApplied ? 'Already Applied' : 'Submit Application'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  headerBar: {
    paddingTop: 42,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  jobCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  jobSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  spinnerWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    paddingHorizontal: 24,
    marginTop: 80,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  detailBody: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  applyCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    gap: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
    fontSize: 13,
    marginBottom: 6,
  },
  applyBtn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
})
