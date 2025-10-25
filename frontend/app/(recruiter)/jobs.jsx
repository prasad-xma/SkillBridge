import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, useColorScheme, FlatList, TouchableOpacity, ScrollView, Modal, Linking, TextInput } from 'react-native'
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
  const [viewing, setViewing] = useState(null)
  const [dismissedRejected, setDismissedRejected] = useState({})
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [manageOpen, setManageOpen] = useState(false)
  const [manageStatus, setManageStatus] = useState('published')
  const [filePctOpen, setFilePctOpen] = useState(false)
  const [fileText, setFileText] = useState('')
  const [filePct, setFilePct] = useState(null)
  const [fileLoading, setFileLoading] = useState(false)

  const showToast = (message, type = 'info', duration = 2500) => {
    setToast({ visible: true, message, type })
    if (duration > 0) {
      setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
    }
  }
  const safeOpenUrl = async (url) => {
    try {
      if (typeof url !== 'string') {
        showToast('Resume URL is invalid', 'error')
        return
      }
      const trimmed = url.trim()
      if (!/^https?:\/\//i.test(trimmed)) {
        showToast('Resume URL must start with http(s)://', 'error')
        return
      }
      const can = await Linking.canOpenURL(trimmed)
      if (!can) {
        showToast('Cannot open this URL on device', 'error')
        return
      }
      await Linking.openURL(trimmed)
    } catch (e) {
      showToast('Failed to open URL', 'error')
    }
  }

  const computePercentileFromText = (text, job) => {
    if (!text || !text.trim()) return 0
    const jobSkillsRaw = job?.skills || job?.requiredSkills || job?.jobSkills || job?.tags
    const jobSkills = Array.isArray(jobSkillsRaw)
      ? jobSkillsRaw
      : typeof jobSkillsRaw === 'string'
      ? jobSkillsRaw.split(',').map(s => s.trim()).filter(Boolean)
      : []
    if (!jobSkills.length) return 0
    const cvLower = text.toLowerCase()
    let hits = 0
    for (const sk of jobSkills) {
      const s = String(sk).toLowerCase().trim()
      if (!s) continue
      if (cvLower.includes(s)) hits += 1
    }
    return Math.round((hits / jobSkills.length) * 100)
  }

  const handlePercentileFromFile = async () => {
    try {
      setFileLoading(true)
      let text = fileText
      if ((!text || !text.trim()) && viewing?.resumeUrl && /^https?:\/\//i.test(viewing.resumeUrl)) {
        // Basic support: fetch plain text files only
        try {
          if (/\.txt($|\?)/i.test(viewing.resumeUrl)) {
            const resp = await fetch(viewing.resumeUrl)
            text = await resp.text()
          }
        } catch (_) {}
      }
      if (!text || !text.trim()) {
        showToast('Provide resume text (paste) or a .txt URL', 'error')
        setFilePct(null)
        return
      }
      const pct = computePercentileFromText(text, selectedJob)
      setFilePct(pct)
    } finally {
      setFileLoading(false)
    }
  }


  const updateJobStatus = async (jobId, newStatus) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        showToast('API_BASE is not set. Configure in frontend/.env or app.json', 'error')
        return
      }
      await axios.put(`${API_BASE}/api/recruiter/jobs/${jobId}`, { status: newStatus })
      showToast(`Job moved to ${newStatus}`, 'success')
      const session = await getSession()
      if (session?.uid) await fetchJobs(session.uid)
    } catch (e) {
      showToast(e?.response?.data?.message || e?.message || 'Failed to update job status', 'error')
    }
  }

  const applicants = useMemo(() => {
    const base = applicantsRaw
    if (tab === 'All') return base.filter(a => !['shortlisted', 'rejected', 'hired'].includes(a.status))
    if (tab === 'Shortlisted') return base.filter(a => a.status === 'shortlisted')
    if (tab === 'Hired') return base.filter(a => a.status === 'hired')
    if (tab === 'Rejected') return base.filter(a => a.status === 'rejected' && !dismissedRejected[a.id])
    return base
  }, [tab, applicantsRaw, dismissedRejected])

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
        showToast('API_BASE is not set. Configure in frontend/.env or app.json', 'error')
        return
      }
      const url = `${API_BASE}/api/recruiter/jobs`
      console.log('[Recruiter] GET', url, { recruiterId })
      const resp = await axios.get(url, { params: { recruiterId } })
      const list = Array.isArray(resp.data) ? resp.data : []
      setJobs(list)
    } catch (e) {
      console.warn('[Recruiter] fetchJobs error', e?.response?.data || e?.message)
      showToast(e?.response?.data?.message || e?.message || 'Failed to fetch jobs', 'error')
    }
  }

  const deleteJob = async (jobId) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        showToast('API_BASE is not set. Configure in frontend/.env or app.json', 'error')
        return
      }
      showToast('Deleting job...', 'info', 1200)
      await axios.delete(`${API_BASE}/api/recruiter/jobs/${jobId}`)
      const session = await getSession()
      if (session?.uid) await fetchJobs(session.uid)
      showToast('Job deleted', 'success')
    } catch (e) {
      showToast(e?.response?.data?.message || e?.message || 'Failed to delete job', 'error')
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
          showToast('API_BASE is not set. Configure in frontend/.env or app.json', 'error')
          return
        }
        const url = `${API_BASE}/api/recruiter/jobs/${selectedJob.id}/applicants`
        console.log('[Recruiter] GET', url)
        const resp = await axios.get(url)
        const arr = Array.isArray(resp.data) ? resp.data : []
        const normalize = (a) => {
          const id = a.id || a.applicantId || a.userId || a.uid || `${a.email || a?.applicant?.email || ''}-${a.jobId || selectedJob.id}`
          const applicantObj = a.applicant || a.candidate || {}
          const name = a.name || a.applicantName || applicantObj.name || a.fullName || a.username
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
          let match = a.matchPercentage ?? a.match ?? a.matchScore ?? a.similarity
          if (typeof match === 'string') {
            const m = parseFloat(match)
            match = Number.isFinite(m) ? m : undefined
          }
          if (match != null && match <= 1) match = Math.round(match * 100)
          if (match != null && match > 1 && match <= 100) match = Math.round(match)
          // Compute match from CV text if not provided
          if (match == null || !Number.isFinite(match)) {
            const jobSkillsRaw = selectedJob?.skills || selectedJob?.requiredSkills || selectedJob?.jobSkills || selectedJob?.tags
            const jobSkills = Array.isArray(jobSkillsRaw)
              ? jobSkillsRaw
              : typeof jobSkillsRaw === 'string'
              ? jobSkillsRaw.split(',').map(s => s.trim()).filter(Boolean)
              : []
            const cvTextRaw = a.cvDescription || a.cvDetails || a.cv || a.resumeText || a.coverLetter || applicantObj.cvDescription || applicantObj.cv
            if (jobSkills.length && typeof cvTextRaw === 'string' && cvTextRaw.trim().length) {
              const cvLower = cvTextRaw.toLowerCase()
              let hits = 0
              for (const sk of jobSkills) {
                const s = String(sk).toLowerCase().trim()
                if (!s) continue
                // simple containment check; could be improved with regex word-boundaries
                if (cvLower.includes(s)) hits += 1
              }
              match = Math.round((hits / jobSkills.length) * 100)
            }
          }
          if (match == null || !Number.isFinite(match)) match = 0
          const resumeUrl = a.resumeUrl || a.resume || applicantObj.resumeUrl
          const portfolioUrl = a.portfolioUrl || applicantObj.portfolioUrl
          const linkedin = a.linkedin || applicantObj.linkedin
          const github = a.github || applicantObj.github
          const status = a.status
          return { id, name, email, phone, location, education, experienceYears, expectedSalary, skills, matchPercentage: match, resumeUrl, portfolioUrl, linkedin, github, status }
        }
        setApplicantsRaw(arr.map(normalize))
      } catch (e) {
        console.warn('[Recruiter] load applicants error', e?.response?.data || e?.message)
        showToast(e?.response?.data?.message || e?.message || 'Failed to fetch applicants', 'error')
      }
    })()
  }, [selectedJob])

  const updateApplicant = async (jobId, applicantId, action) => {
    try {
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        showToast('API_BASE is not set. Configure in frontend/.env or app.json', 'error')
        return
      }
      const url = `${API_BASE}/api/recruiter/jobs/${jobId}/applicants/${applicantId}/${action}`
      console.log('[Recruiter] PUT', url)
      await axios.put(url)
      // optimistic local update so item disappears from 'All'
      const newStatus = action === 'shortlist' ? 'shortlisted' : action === 'reject' ? 'rejected' : action === 'hire' ? 'hired' : action === 'undo' ? 'pending' : undefined
      if (newStatus) {
        setApplicantsRaw((prev) => prev.map((a) => (a.id === applicantId ? { ...a, status: newStatus } : a)))
      }
      if (action === 'hire') {
        setTab('Hired')
      }
      // If user re-confirms Reject while in Rejected tab, hide it from this tab
      if (action === 'reject' && tab === 'Rejected') {
        setDismissedRejected((prev) => ({ ...prev, [applicantId]: true }))
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
      showToast(e?.response?.data?.message || e?.message || `Failed to ${action}`, 'error')
    }
  }

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Top bar */}
      <View style={[styles.headerBar, { borderColor: theme.border }]}> 
        <Text style={[styles.headerTitle, { color: theme.text }]}>Jobs</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setManageOpen(true)} style={[styles.manageBtn, { borderColor: theme.border }]}> 
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Manage Jobs</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(recruiter)/post-job')} style={[styles.postBtn, { borderColor: theme.border }]}> 
            <Text style={{ color: '#ffffff', fontWeight: '700' }}>Post Job</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Jobs list or Job details */}
      {!selectedJob ? (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {jobs.map((job) => (
            <View key={job.id} style={[styles.jobCard, styles.cardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.jobTitle, { color: theme.text }]}>{job.title}</Text>
                <Text style={{ color: theme.textSecondary }}>{job.applicantsCount ?? '-'} applicants</Text>
              </View>
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                <TouchableOpacity onPress={() => setSelectedJob(job)} style={[styles.statusBtn, { borderColor: theme.border }]}> 
                  <Text style={{ color: '#ffffff' }}>Check Status</Text>
                </TouchableOpacity>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity style={[styles.actionBtn, styles.shortlist]} onPress={() => router.push({ pathname: '/(recruiter)/edit-job', params: { id: job.id } })}>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, styles.reject]} onPress={() => deleteJob(job.id)}>
                    <Text style={styles.actionText}>Delete</Text>
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
            {['All', 'Shortlisted', 'Hired', 'Rejected'].map(t => (
              <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabItem, tab === t && styles.tabItemActive]}> 
                <Text style={{ color: tab === t ? '#ffffff' : theme.textSecondary, fontWeight: tab === t ? '700' : '600' }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Applicants List */}
          <FlatList
            contentContainerStyle={{ padding: 16 }}
            data={applicants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.applicantCard, styles.cardShadow, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                <View style={{ flex: 1 }}>
                  <Text style={[styles.applicantName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={{ color: theme.textSecondary, marginTop: 4 }}>Skills: {Array.isArray(item.skills) ? item.skills.join(', ') : item.skills}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {(() => {
                    const pct = Number(item.matchPercentage ?? item.match ?? 0) || 0
                    const bg = pct >= 80 ? '#dcfce7' : pct >= 60 ? '#fef9c3' : '#fee2e2'
                    const fg = pct >= 80 ? '#166534' : pct >= 60 ? '#92400e' : '#991b1b'
                    return (
                      <View style={[styles.matchPill, { backgroundColor: bg }]}>
                        <Text style={[styles.matchText, { color: fg }]}>{pct}%</Text>
                      </View>
                    )
                  })()}
                  <View style={styles.actionsRow}>
                    {/* Always allow viewing */}
                    <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={() => setViewing(item)}><Text style={styles.viewText}>View</Text></TouchableOpacity>
                    {/* Actions depend on tab/status */}
                    {tab === 'All' && (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, styles.shortlist]} onPress={() => updateApplicant(selectedJob.id, item.id, 'shortlist')}><Text style={styles.actionText}>Shortlist</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.reject]} onPress={() => updateApplicant(selectedJob.id, item.id, 'reject')}><Text style={styles.actionText}>Reject</Text></TouchableOpacity>
                      </>
                    )}
                    {tab === 'Shortlisted' && (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, styles.hire]} onPress={() => updateApplicant(selectedJob.id, item.id, 'hire')}><Text style={styles.actionText}>Hire</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.reject]} onPress={() => updateApplicant(selectedJob.id, item.id, 'reject')}><Text style={styles.actionText}>Reject</Text></TouchableOpacity>
                      </>
                    )}
                    {tab === 'Hired' && (
                      <></>
                    )}
                    {tab === 'Rejected' && (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, styles.undo]} onPress={() => updateApplicant(selectedJob.id, item.id, 'undo')}><Text style={styles.actionText}>Undo</Text></TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.reject]} onPress={() => updateApplicant(selectedJob.id, item.id, 'reject')}><Text style={styles.actionText}>Reject</Text></TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              </View>
            )}
          />
          <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: '88%', borderRadius: 12, padding: 16, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>{viewing?.name || 'Applicant'}</Text>
                <Text style={{ marginTop: 8, color: theme.textSecondary }}>Email: {viewing?.email || '-'}</Text>
                {viewing?.phone || viewing?.mobile ? (
                  <Text style={{ marginTop: 4, color: theme.textSecondary }}>Phone: {viewing?.phone || viewing?.mobile}</Text>
                ) : null}
                {viewing?.location || viewing?.city ? (
                  <Text style={{ marginTop: 4, color: theme.textSecondary }}>Location: {viewing?.location || viewing?.city}</Text>
                ) : null}
                {viewing?.education || viewing?.qualification ? (
                  <Text style={{ marginTop: 4, color: theme.textSecondary }}>Education: {viewing?.education || viewing?.qualification}</Text>
                ) : null}
                {viewing?.experienceYears != null || viewing?.experience != null ? (
                  <Text style={{ marginTop: 4, color: theme.textSecondary }}>Experience: {viewing?.experienceYears ?? viewing?.experience} years</Text>
                ) : null}
                {viewing?.expectedSalary ? (
                  <Text style={{ marginTop: 4, color: theme.textSecondary }}>Expected Salary: {viewing?.expectedSalary}</Text>
                ) : null}
                <Text style={{ marginTop: 4, color: theme.textSecondary }}>Skills: {Array.isArray(viewing?.skills) ? viewing?.skills?.join(', ') : viewing?.skills || '-'}</Text>
                <Text style={{ marginTop: 4, color: theme.textSecondary }}>Match: {viewing?.matchPercentage ?? viewing?.match ?? '-'}%</Text>
                {viewing?.resumeUrl ? (
                  <Text
                    style={{ marginTop: 8, color: '#3b82f6', fontWeight: '700' }}
                    onPress={() => safeOpenUrl(viewing?.resumeUrl)}
                  >
                    Open Resume
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <TouchableOpacity onPress={() => setFilePctOpen(true)} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#3b82f6' }}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Check Percentile (File)</Text>
                  </TouchableOpacity>
                </View>
                {viewing?.portfolioUrl ? (
                  <Text
                    style={{ marginTop: 6, color: '#3b82f6', fontWeight: '700' }}
                    onPress={() => Linking.openURL(viewing?.portfolioUrl)}
                  >
                    Portfolio
                  </Text>
                ) : null}
                {viewing?.linkedin ? (
                  <Text
                    style={{ marginTop: 6, color: '#3b82f6', fontWeight: '700' }}
                    onPress={() => Linking.openURL(viewing?.linkedin)}
                  >
                    LinkedIn
                  </Text>
                ) : null}
                {viewing?.github ? (
                  <Text
                    style={{ marginTop: 6, color: '#3b82f6', fontWeight: '700' }}
                    onPress={() => Linking.openURL(viewing?.github)}
                  >
                    GitHub
                  </Text>
                ) : null}
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
                  <TouchableOpacity onPress={() => setViewing(null)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#111827' }}>
                    <Text style={{ color: '#ffffff', fontWeight: '700' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
      {/* Percentile from File/Text Modal */}
      <Modal visible={filePctOpen} transparent animationType="fade" onRequestClose={() => { setFilePctOpen(false); setFilePct(null); setFileText('') }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '92%', borderRadius: 12, padding: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Percentile from File/Text</Text>
            <Text style={{ marginTop: 8, color: theme.textSecondary }}>
              Paste resume text below or ensure the resume URL is a .txt file. PDFs are not parsed on-device.
            </Text>
            <TextInput
              value={fileText}
              onChangeText={setFileText}
              placeholder="Paste resume text here"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={{ marginTop: 10, minHeight: 140, maxHeight: 260, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 10, color: theme.text }}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              <TouchableOpacity onPress={handlePercentileFromFile} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#16a34a' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>{fileLoading ? 'Calculating...' : 'Calculate'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setFilePctOpen(false); setFilePct(null); setFileText('') }} style={{ paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#111827' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>
            {filePct != null && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ color: theme.text, fontWeight: '800' }}>Percentile: {filePct}%</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
        </View>
      )}
      {/* Toast */}
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : toast.type === 'success' ? styles.toastSuccess : styles.toastInfo]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* Manage Jobs Modal */}
      <Modal visible={manageOpen} transparent animationType="fade" onRequestClose={() => setManageOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '92%', borderRadius: 12, padding: 14, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>Manage Jobs</Text>
              <TouchableOpacity onPress={() => setManageOpen(false)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: '#111827' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </View>

            {/* Status Segmented Control */}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {[
                { key: 'published', label: 'Published' },
                { key: 'draft', label: 'Draft' },
                { key: 'archived', label: 'Archived' },
              ].map(opt => (
                <TouchableOpacity key={opt.key} onPress={() => setManageStatus(opt.key)} style={[{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: theme.border }, manageStatus === opt.key ? { backgroundColor: '#111827' } : { backgroundColor: theme.card }]}>
                  <Text style={{ color: manageStatus === opt.key ? '#ffffff' : theme.textSecondary, fontWeight: manageStatus === opt.key ? '700' : '600' }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Jobs List by Status */}
            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingVertical: 12 }}>
              {jobs.filter(j => (j.status || 'published') === manageStatus).map(job => (
                <View key={job.id} style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 10, padding: 12, marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={{ color: theme.text, fontWeight: '800' }}>{job.title}</Text>
                      <Text style={{ color: theme.textSecondary, marginTop: 2 }}>{job.location} • {job.category}</Text>
                      <Text style={{ color: theme.textSecondary, marginTop: 2 }}>Applicants: {job.applicantsCount ?? '-'}</Text>
                    </View>
                    <View style={{ gap: 6, alignItems: 'flex-end' }}>
                      {/* Quick status actions */}
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        <TouchableOpacity onPress={() => updateJobStatus(job.id, 'published')} style={[styles.smallBtn, { backgroundColor: '#16a34a' }]}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Publish</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => updateJobStatus(job.id, 'draft')} style={[styles.smallBtn, { backgroundColor: '#f59e0b' }]}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Draft</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => updateJobStatus(job.id, 'archived')} style={[styles.smallBtn, { backgroundColor: '#6b7280' }]}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>Archive</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
              {jobs.filter(j => (j.status || 'published') === manageStatus).length === 0 && (
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 12 }}>No jobs in this status</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  toast: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  toastInfo: {
    backgroundColor: '#111827',
  },
  toastSuccess: {
    backgroundColor: '#16a34a',
  },
  toastError: {
    backgroundColor: '#dc2626',
  },
  toastText: {
    color: '#ffffff',
    fontWeight: '700',
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
    backgroundColor: '#2563eb',
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
    fontSize: 18,
    fontWeight: '700',
  },
  statusBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#111827',
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
    backgroundColor: '#111827',
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
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  smallBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: '#10b981',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
  },
  viewBtn: {
    backgroundColor: '#3b82f6',
  },
  shortlist: {
    backgroundColor: '#22c55e',
  },
  reject: {
    backgroundColor: '#ef4444',
  },
  undo: {
    backgroundColor: '#f59e0b',
  },
  hire: {
    backgroundColor: '#6366f1',
  },
  viewText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
})
