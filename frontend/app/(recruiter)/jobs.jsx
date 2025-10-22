import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { useFocusEffect } from '@react-navigation/native'

export default function RecruiterJobs() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [jobs, setJobs] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const [tab, setTab] = useState('All')
  const [applicantsRaw, setApplicantsRaw] = useState([])

  const applicants = useMemo(() => {
    const base = applicantsRaw
    if (tab === 'All') return base.filter(a => !['shortlisted', 'rejected', 'hired'].includes(a.status))
    if (tab === 'Shortlisted') return base.filter(a => a.status === 'shortlisted')
    if (tab === 'Hired') return base.filter(a => a.status === 'hired')
    return base
  }, [tab, applicantsRaw])

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      setChecked(true)
      await fetchJobs(session.uid)
    })()
  }, [])

  const fetchJobs = async (recruiterId) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        Alert.alert('Configuration error', 'API_BASE is not set. Add it to frontend/.env or app.json')
        return
      }
      const url = `${API_BASE}/api/recruiter/jobs`
      console.log('[Recruiter] GET', url, { recruiterId })
      const resp = await axios.get(url, { params: { recruiterId } })
      const list = Array.isArray(resp.data) ? resp.data : []
      setJobs(list)
    } catch (e) {
      console.warn('[Recruiter] fetchJobs error', e?.response?.data || e?.message)
      Alert.alert('Failed to fetch jobs', e?.response?.data?.message || e?.message || 'Network error')
    }
  }

  const deleteJob = async (jobId) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      await axios.delete(`${API_BASE}/api/recruiter/jobs/${jobId}`)
      const session = await getSession()
      if (session?.uid) await fetchJobs(session.uid)
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to delete job')
    }
  }

  // Refresh jobs whenever this screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const session = await getSession()
        if (session?.uid) await fetchJobs(session.uid)
      })()
      return () => {}
    }, [])
  )

  useEffect(() => {
    (async () => {
      if (!selectedJob) return
      try {
        const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
        if (!API_BASE) {
          Alert.alert('Configuration error', 'API_BASE is not set. Add it to frontend/.env or app.json')
          return
        }
        const url = `${API_BASE}/api/recruiter/jobs/${selectedJob.id}/applicants`
        console.log('[Recruiter] GET', url)
        const resp = await axios.get(url)
        const arr = Array.isArray(resp.data) ? resp.data : []
        setApplicantsRaw(arr)
      } catch (e) {
        console.warn('[Recruiter] load applicants error', e?.response?.data || e?.message)
        Alert.alert('Failed to fetch applicants', e?.response?.data?.message || e?.message || 'Network error')
      }
    })()
  }, [selectedJob])

  const updateApplicant = async (jobId, applicantId, action) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        Alert.alert('Configuration error', 'API_BASE is not set. Add it to frontend/.env or app.json')
        return
      }
      const url = `${API_BASE}/api/recruiter/jobs/${jobId}/applicants/${applicantId}/${action}`
      console.log('[Recruiter] PUT', url)
      await axios.put(url)
      // optimistic local update so item disappears from 'All'
      const newStatus = action === 'shortlist' ? 'shortlisted' : action === 'reject' ? 'rejected' : action === 'hire' ? 'hired' : undefined
      if (newStatus) {
        setApplicantsRaw((prev) => prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a)))
      }
      // optional background refresh to stay in sync (non-blocking)
      try {
        const resp = await axios.get(`${API_BASE}/api/recruiter/jobs/${jobId}/applicants`)
        setApplicantsRaw(Array.isArray(resp.data) ? resp.data : [])
      } catch (_) {
        // ignore background refresh errors
      }
    } catch (e) {
      console.warn('[Recruiter] updateApplicant error', e?.response?.data || e?.message)
      Alert.alert('Failed to update applicant', e?.response?.data?.message || e?.message || `Failed to ${action}`)
    }
  }

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top bar */}
      <View style={[styles.headerBar, { borderColor: theme.border }]}> 
        <Text style={[styles.headerTitle, { color: theme.text }]}>Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/(recruiter)/post-job')} style={[styles.postBtn, { borderColor: theme.border }]}> 
          <Text style={{ color: theme.text }}>Post Job</Text>
        </TouchableOpacity>
      </View>

      {/* Jobs list or Job details */}
      {!selectedJob ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {jobs.map((job) => (
            <View key={job.id} style={[styles.jobCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                <Text style={{ color: theme.textSecondary }}>{job.applicantsCount ?? '-'} applicants</Text>
              </View>
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={() => setSelectedJob(job)} style={[styles.statusBtn, { borderColor: theme.border }]}> 
                  <Text style={{ color: theme.text }}>Check Status</Text>
                </TouchableOpacity>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity style={[styles.smallBtn, styles.editBtn]} onPress={() => router.push({ pathname: '/(recruiter)/edit-job', params: { id: job.id } })}>
                    <Text style={styles.smallBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallBtn, styles.deleteBtn]} onPress={() => {
                    Alert.alert('Delete Job', 'Are you sure you want to delete this job?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id) },
                    ])
                  }}>
                    <Text style={styles.smallBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Selected Job Header */}
          <View style={[styles.selectedHeader, { borderColor: theme.border }]}> 
            <TouchableOpacity onPress={() => setSelectedJob(null)} style={[styles.backBtn, { borderColor: theme.border }]}>
              <Text style={{ color: theme.text }}>{'<'} Back</Text>
            </TouchableOpacity>
            <Text style={[styles.selectedTitle, { color: theme.text }]}>{selectedJob.title}</Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabs, { borderColor: theme.border }]}> 
            {['All', 'Shortlisted', 'Hired'].map(t => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabItem, tab === t && styles.tabItemActive]}> 
                <Text style={{ color: tab === t ? '#111827' : theme.textSecondary, fontWeight: tab === t ? '700' : '600' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Applicants List */}
          <FlatList
            contentContainerStyle={{ padding: 16 }}
            data={applicants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.applicantCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.applicantName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>Skills: {Array.isArray(item.skills) ? item.skills.join(', ') : item.skills}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={styles.matchPill}><Text style={styles.matchText}>{item.matchPercentage ?? item.match ?? '-'}%</Text></View>
                  <View style={styles.actionsRow}>
                    <TouchableOpacity style={[styles.actionBtn, styles.shortlist]} onPress={() => updateApplicant(selectedJob.id, item.id, 'shortlist')}><Text style={styles.actionText}>Shortlist</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.reject]} onPress={() => updateApplicant(selectedJob.id, item.id, 'reject')}><Text style={styles.actionText}>Reject</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, styles.hire]} onPress={() => updateApplicant(selectedJob.id, item.id, 'hire')}><Text style={styles.actionText}>Hire</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  postBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  jobCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  statusBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selectedHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
  },
  tabItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
  },
  tabItemActive: {
    backgroundColor: '#c7d2fe',
  },
  applicantCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantName: {
    fontSize: 15,
    fontWeight: '700',
  },
  matchPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  matchText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  shortlist: {
    backgroundColor: '#22c55e',
  },
  reject: {
    backgroundColor: '#ef4444',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
})
