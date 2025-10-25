import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Linking } from 'react-native'
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
  const [suggested, setSuggested] = useState([])
  const [viewing, setViewing] = useState(null)

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
      const sugg = Array.isArray(d.suggestedCandidates) ? d.suggestedCandidates : []
      const suggFiltered = sugg.filter((c) => {
        const m = c?.matchPercentage ?? c?.match
        const n = typeof m === 'string' ? parseFloat(m) : m
        return Number.isFinite(n) && n > 50
      })
      setSuggested(suggFiltered)
      // Fallback: compute suggestions locally if API returned none
      if (sugg.length === 0) {
        try {
          const jobsResp = await axios.get(`${API_BASE}/api/recruiter/jobs`, { params: { recruiterId: uid } })
          const jobsList = Array.isArray(jobsResp.data) ? jobsResp.data : []
          const allCandidates = []
          for (const job of jobsList) {
            try {
              const applicantsResp = await axios.get(`${API_BASE}/api/recruiter/jobs/${job.id}/applicants`)
              const applicantsArr = Array.isArray(applicantsResp.data) ? applicantsResp.data : []
              const jobSkillsRaw = job?.skills || job?.requiredSkills || job?.jobSkills || job?.tags
              const jobSkills = Array.isArray(jobSkillsRaw)
                ? jobSkillsRaw
                : typeof jobSkillsRaw === 'string'
                ? jobSkillsRaw.split(',').map(s => s.trim()).filter(Boolean)
                : []
              for (const a of applicantsArr) {
                const applicantObj = a.applicant || a.candidate || {}
                const name = a.name || a.applicantName || applicantObj.name || 'Candidate'
                const email = a.email || a.applicantEmail || applicantObj.email
                const phone = a.phone || a.mobile || applicantObj.phone
                const location = a.location || a.city || applicantObj.location
                const education = a.education || a.qualification || applicantObj.education
                const experienceYears = a.experienceYears ?? a.experience ?? applicantObj.experienceYears ?? applicantObj.experience
                const expectedSalary = a.expectedSalary || applicantObj.expectedSalary
                const skillsRaw = a.applicantSkills || applicantObj.skills || a.skills || a.candidateSkills
                const skills = Array.isArray(skillsRaw)
                  ? skillsRaw
                  : typeof skillsRaw === 'string'
                  ? skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
                  : []
                const cvTextRaw = a.cvDescription || a.cvDetails || a.cv || a.resumeText || a.coverLetter || applicantObj.cvDescription || applicantObj.cv
                // compute match
                let match = a.matchPercentage ?? a.match ?? a.matchScore ?? a.similarity
                if (typeof match === 'string') {
                  const m = parseFloat(match)
                  match = Number.isFinite(m) ? m : undefined
                }
                if (match != null && match <= 1) match = Math.round(match * 100)
                if (match != null && match > 1 && match <= 100) match = Math.round(match)
                if ((match == null || !Number.isFinite(match)) && jobSkills.length) {
                  let hits = 0
                  const cvLower = typeof cvTextRaw === 'string' ? cvTextRaw.toLowerCase() : ''
                  for (const sk of jobSkills) {
                    const s = String(sk).toLowerCase().trim()
                    if (!s) continue
                    // Align with jobs.jsx: only check CV text containment for hits
                    if (cvLower.includes(s)) hits += 1
                  }
                  match = Math.round((hits / jobSkills.length) * 100)
                }
                if (match == null || !Number.isFinite(match)) match = 0
                const resumeUrl = a.resumeUrl || a.resume || applicantObj.resumeUrl
                const portfolioUrl = a.portfolioUrl || applicantObj.portfolioUrl
                const linkedin = a.linkedin || applicantObj.linkedin
                const github = a.github || applicantObj.github
                allCandidates.push({ id: a.id || email || `${name}-${job.id}`, name, email, phone, location, education, experienceYears, expectedSalary, skills, matchPercentage: match, jobId: job.id, jobTitle: job.title, resumeUrl, portfolioUrl, linkedin, github })
              }
            } catch (_) { /* ignore per-job errors */ }
          }
          // Deduplicate by email+name and take top 5
          const seen = new Set()
          const unique = []
          for (const c of allCandidates
            .filter(x => (x.matchPercentage ?? 0) > 50)
            .sort((a,b) => (b.matchPercentage||0) - (a.matchPercentage||0))) {
            const key = `${c.email || ''}-${c.name || ''}`
            if (seen.has(key)) continue
            seen.add(key)
            unique.push(c)
            if (unique.length >= 5) break
          }
          if (unique.length) setSuggested(unique)
        } catch (_) {
          // ignore fallback suggestion errors
        }
      }
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
        {(() => {
          const msgOf = (it) =>
            it.type === 'applicant_status'
              ? `${it.applicantName || 'Applicant'} ${it.status} for ${it.jobTitle || 'a job'}`
              : it.type || 'Activity'

          const seen = new Set()
          const unique = []
          for (const it of recent) {
            const m = msgOf(it)
            if (seen.has(m)) continue
            seen.add(m)
            unique.push({ ...it, __msg: m })
          }

          return unique.map((item, idx) => (
            <View key={item.id || item.__msg}>
              {idx > 0 && <View style={[styles.separator, { backgroundColor: theme.border }]} />}
              <Text style={{ color: theme.textSecondary }}>{item.__msg}</Text>
            </View>
          ))
        })()}
      </View>

      {/* Suggested Candidates */}
      <View style={[styles.sectionCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Suggested Candidates</Text>
        {suggested.length === 0 && (
          <Text style={{ color: theme.textSecondary }}>No suggestions yet</Text>
        )}
        {suggested.map((cand, idx) => (
          <View key={cand.id || `${cand.name}-${idx}`} style={[styles.applicantCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
            <View style={{ flex: 1 }}>
              <Text style={[styles.applicantName, { color: theme.text }]}>{cand.name || 'Candidate'}</Text>
              <Text style={{ color: theme.textSecondary, marginTop: 2 }}>Email: {cand.email || cand?.applicant?.email || '-'}</Text>
              <Text style={{ color: theme.textSecondary, marginTop: 2 }}>Job: {cand.jobTitle || cand?.job?.title || '-'}</Text>
              {(cand.phone || cand?.applicant?.phone) && (
                <Text style={{ color: theme.textSecondary, marginTop: 2 }}>Phone: {cand.phone || cand?.applicant?.phone}</Text>
              )}
              {(cand.location || cand?.city || cand?.applicant?.location) && (
                <Text style={{ color: theme.textSecondary, marginTop: 2 }}>Location: {cand.location || cand?.city || cand?.applicant?.location}</Text>
              )}
              <Text style={{ color: theme.textSecondary, marginTop: 4 }}>
                Skills: {Array.isArray(cand.skills) ? cand.skills.join(', ') : cand.skills || '-'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <View style={styles.matchPill}><Text style={styles.matchText}>{cand.matchPercentage ?? cand.match ?? '-'}%</Text></View>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => setViewing(cand)}>
                  <Text style={styles.viewText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '88%', borderRadius: 12, padding: 16, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{viewing?.name || 'Candidate'}</Text>
            <Text style={{ marginTop: 8, color: theme.textSecondary }}>Email: {viewing?.email || viewing?.applicant?.email || '-'}</Text>
            {viewing?.phone || viewing?.mobile || viewing?.applicant?.phone ? (
              <Text style={{ marginTop: 4, color: theme.textSecondary }}>Phone: {viewing?.phone || viewing?.mobile || viewing?.applicant?.phone}</Text>
            ) : null}
            {viewing?.location || viewing?.city || viewing?.applicant?.location ? (
              <Text style={{ marginTop: 4, color: theme.textSecondary }}>Location: {viewing?.location || viewing?.city || viewing?.applicant?.location}</Text>
            ) : null}
            {viewing?.education || viewing?.qualification || viewing?.applicant?.education ? (
              <Text style={{ marginTop: 4, color: theme.textSecondary }}>Education: {viewing?.education || viewing?.qualification || viewing?.applicant?.education}</Text>
            ) : null}
            {viewing?.experienceYears != null || viewing?.experience != null || viewing?.applicant?.experienceYears != null || viewing?.applicant?.experience != null ? (
              <Text style={{ marginTop: 4, color: theme.textSecondary }}>Experience: {viewing?.experienceYears ?? viewing?.experience ?? viewing?.applicant?.experienceYears ?? viewing?.applicant?.experience} years</Text>
            ) : null}
            {viewing?.expectedSalary ? (
              <Text style={{ marginTop: 4, color: theme.textSecondary }}>Expected Salary: {viewing?.expectedSalary}</Text>
            ) : null}
            <Text style={{ marginTop: 4, color: theme.textSecondary }}>Skills: {Array.isArray(viewing?.skills) ? viewing?.skills?.join(', ') : viewing?.skills || '-'}</Text>
            <Text style={{ marginTop: 4, color: theme.textSecondary }}>Match: {viewing?.matchPercentage ?? viewing?.match ?? '-'}%</Text>
            {viewing?.resumeUrl ? (
              <Text style={{ marginTop: 8, color: '#3b82f6', fontWeight: '700' }} onPress={() => Linking.openURL(viewing?.resumeUrl)}>Open Resume</Text>
            ) : null}
            {viewing?.portfolioUrl ? (
              <Text style={{ marginTop: 6, color: '#3b82f6', fontWeight: '700' }} onPress={() => Linking.openURL(viewing?.portfolioUrl)}>Portfolio</Text>
            ) : null}
            {viewing?.linkedin ? (
              <Text style={{ marginTop: 6, color: '#3b82f6', fontWeight: '700' }} onPress={() => Linking.openURL(viewing?.linkedin)}>LinkedIn</Text>
            ) : null}
            {viewing?.github ? (
              <Text style={{ marginTop: 6, color: '#3b82f6', fontWeight: '700' }} onPress={() => Linking.openURL(viewing?.github)}>GitHub</Text>
            ) : null}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setViewing(null)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#111827' }}>
                <Text style={{ color: '#ffffff', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    flexWrap: 'wrap',
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  viewBtn: {
    backgroundColor: '#3b82f6',
  },
  viewText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
})
