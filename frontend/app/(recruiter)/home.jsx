import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ScrollView, ActivityIndicator } from 'react-native'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'
import { themes } from '../../constants/colors'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { useFocusEffect } from '@react-navigation/native'

export default function RecruiterHome() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ newApplicants: 0, jobsPosted: 0, shortlisted: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      setUser(session)
      await loadDashboard(session.uid)
    })()
  }, [])

  const loadDashboard = async (uid) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        // leave stats as-is but stop spinner
        setLoading(false)
        return
      }
      const url = `${API_BASE}/api/recruiter/recruiter/${uid}/dashboard`
      console.log('[Recruiter] GET', url)
      const resp = await axios.get(url)
      const d = resp.data || {}
      setStats({
        newApplicants: d.totalApplicants || 0,
        jobsPosted: d.jobsPosted || 0,
        shortlisted: d.shortlisted || 0,
      })
      const activity = Array.isArray(d.recentActivity) ? d.recentActivity : []
      setRecent(activity)
    } catch (e) {
      console.warn('[Recruiter] dashboard error', e?.response?.data || e?.message)
    } finally {
      setLoading(false)
    }
  }

  // Refresh dashboard when screen regains focus (after posting/editing jobs)
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        const s = await getSession()
        if (s?.uid) {
          setLoading(true)
          await loadDashboard(s.uid)
        }
      })()
      return () => {}
    }, [])
  )

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 16, paddingTop: 42 }}>
      {/* Header */}
      <Text style={[styles.header, { color: theme.text }]}>Recruiter Dashboard</Text>

      {loading && (
        <View style={{ paddingVertical: 24 }}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}

      {/* Quick Stats */}
      <View style={styles.row}>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>New Applicants</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.newApplicants}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Jobs Posted</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.jobsPosted}</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Shortlisted</Text>
          <Text style={[styles.statValue, { color: theme.text }]}>{stats.shortlisted}</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
        {recent.length === 0 && (
          <Text style={{ color: theme.textSecondary }}>No recent activity yet</Text>
        )}
        {recent.map((item, idx) => (
          <View key={item.id}>
            {idx > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
            <Text style={{ color: theme.textSecondary }}>
              {item.type === 'applicant_status'
                ? `${item.applicantName || 'Applicant'} ${item.status} for ${item.jobTitle || 'a job'}`
                : item.type || 'Activity'}
            </Text>
          </View>
        ))}
      </View>
      {/* Optional: add suggestions in future when backend provides them */}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  separator: {
    height: 1,
    marginVertical: 10,
  },
  
})
