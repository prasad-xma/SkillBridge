import React, { useEffect, useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as DocumentPicker from 'expo-document-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'

export default function JobDetailScreen() {
  const router = useRouter()
  const { jobId } = useLocalSearchParams()
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSaved, setIsSaved] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const API_BASE = useMemo(() => {
    return process.env.EXPO_PUBLIC_API_BASE || 'http://192.168.8.181:5000'
  }, [])

  useEffect(() => {
    // guard if no jobId
    if (!jobId) {
      setLoading(false)
      return
    }
    fetchJobDetails()
    checkIfSaved()
    loadUserInfo()
  }, [jobId])

  const loadUserInfo = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user')
      if (userJson) {
        const user = JSON.parse(userJson)
        setFullName(user.name || '')
        setEmail(user.email || '')
      }
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  const fetchJobDetails = async () => {
    try {
      // Fetch real job if backend available, else fallback to mock
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data && data.success) {
        setJob(data.data)
      } else if (data && data.data) {
        setJob(data.data)
      } else {
        throw new Error('Invalid response')
      }
    } catch (e) {
      // graceful fallback so the screen still works with list dummy data
      setJob((prev) =>
        prev || {
          id: String(jobId || ''),
          role: 'Job Role',
          company: 'Company',
          location: 'Colombo, Sri Lanka',
          type: 'Full-time',
          workMode: 'On-site',
          applicants: 0,
          postedDate: new Date().toISOString(),
          description:
            'No description available. The server response could not be loaded. This is a fallback view.',
          responsibilities: [
            'Collaborate with the team to deliver features',
            'Write clean, maintainable code',
          ],
          requirements: [
            'Strong problem-solving skills',
            'Good communication skills',
          ],
          offerings: ['Competitive salary', 'Growth opportunities'],
          companyInfo:
            'Company information is not available in offline mode or when the server cannot be reached.',
          alumni: [],
          jobTitle: 'Job Title',
        }
      )
    } finally {
      setLoading(false)
    }
  }

  const checkIfSaved = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user')
      if (!userJson || !jobId) return
      const user = JSON.parse(userJson)
      const res = await fetch(
        `${API_BASE}/api/jobs/check-saved?jobId=${encodeURIComponent(
          jobId
        )}&userId=${encodeURIComponent(user.uid || '')}`
      )
      if (!res.ok) return
      const data = await res.json()
      if (data && data.success) setIsSaved(!!data.isSaved)
    } catch (e) {
      // ignore errors here
    }
  }

  const handleSaveJob = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user')
      if (!userJson) {
        Alert.alert('Login required', 'Please log in to save jobs')
        return
      }
      const user = JSON.parse(userJson)
      const res = await fetch(`${API_BASE}/api/jobs/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, userId: user.uid }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const data = await res.json()
      if (data && data.success) {
        setIsSaved(!!data.isSaved)
        Alert.alert('Success', data.isSaved ? 'Job saved' : 'Job unsaved')
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to update saved status')
    }
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
        multiple: false,
      })
      // Newer expo-document-picker returns {assets, canceled}
      if (result && 'canceled' in result) {
        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0]
          setResume({ name: asset.name || 'resume.pdf', uri: asset.uri, mimeType: asset.mimeType || 'application/pdf' })
        }
        return
      }
      // Legacy shape { type: 'success' | 'cancel', name, uri }
      if (result && result.type === 'success') {
        setResume({ name: result.name, uri: result.uri, mimeType: 'application/pdf' })
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick document')
    }
  }

  const handleSubmitApplication = async () => {
    if (!fullName || !email || !phone) {
      Alert.alert('Missing info', 'Please fill in all required fields')
      return
    }
    if (!resume) {
      Alert.alert('Missing resume', 'Please upload your resume (PDF)')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/jobs/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          fullName,
          email,
          phone,
          coverLetter,
          resumeUrl: resume.uri,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data && data.success) {
        setShowApplyModal(false)
        setShowSuccessModal(true)
        setCoverLetter('')
        setResume(null)
        setPhone('')
      } else {
        Alert.alert('Error', data?.message || 'Failed to submit application')
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.tint} />
      </View>
    )
  }

  if (!job) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>Job not found</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.tint }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSaveJob}>
          <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={isSaved ? theme.tint : theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.companySection, { borderBottomColor: theme.card }]}>
          <View style={[styles.companyIcon, { backgroundColor: theme.tint }]}>
            <Text style={styles.companyInitial}>{(job.company || 'C').charAt(0)}</Text>
          </View>
          <Text style={[styles.role, { color: theme.text }]}>{job.role || job.jobTitle || 'Role'}</Text>
          <Text style={[styles.company, { color: theme.textSecondary }]}>{job.company || 'Company'}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.text }]}>{job.location || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="briefcase" size={16} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.text }]}>{job.type || '—'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="laptop" size={16} color={theme.tint} />
              <Text style={[styles.infoText, { color: theme.text }]}>{job.workMode || '—'}</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: theme.textSecondary }]}>
              {(job.applicants ?? 0)} applicants · Posted {new Date(job.postedDate || Date.now()).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About the Role</Text>
          <Text style={[styles.sectionText, { color: theme.text }]}>{job.description || 'No description available.'}</Text>
        </View>

        <View style={[styles.section, { borderBottomColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Key Responsibilities</Text>
          {(job.responsibilities || []).map((item, index) => (
            <View key={String(index)} style={styles.listItem}>
              <Text style={[styles.bullet, { color: theme.tint }]}>•</Text>
              <Text style={[styles.listText, { color: theme.text }]}>{item}</Text>
            </View>
          ))}
          {(job.responsibilities || []).length === 0 && (
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>No responsibilities listed.</Text>
          )}
        </View>

        <View style={[styles.section, { borderBottomColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Requirements</Text>
          {(job.requirements || []).map((item, index) => (
            <View key={String(index)} style={styles.listItem}>
              <Text style={[styles.bullet, { color: theme.tint }]}>•</Text>
              <Text style={[styles.listText, { color: theme.text }]}>{item}</Text>
            </View>
          ))}
          {(job.requirements || []).length === 0 && (
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>No requirements listed.</Text>
          )}
        </View>

        <View style={[styles.section, { borderBottomColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>What We Offer</Text>
          {(job.offerings || []).map((item, index) => (
            <View key={String(index)} style={styles.listItem}>
              <Text style={[styles.bullet, { color: theme.tint }]}>•</Text>
              <Text style={[styles.listText, { color: theme.text }]}>{item}</Text>
            </View>
          ))}
          {(job.offerings || []).length === 0 && (
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>No benefits listed.</Text>
          )}
        </View>

        <View style={[styles.section, { borderBottomColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>About {job.company || 'Company'}</Text>
          <Text style={[styles.sectionText, { color: theme.text }]}>{job.companyInfo || 'No additional company info.'}</Text>
        </View>

        {!!job.alumni && job.alumni.length > 0 && (
          <View style={[styles.section, { borderBottomColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Alumni at {job.company || 'Company'}</Text>
            {job.alumni.map((person, index) => (
              <View key={String(index)} style={styles.alumniItem}>
                <View style={[styles.alumniIcon, { backgroundColor: theme.tint }]}>
                  <Text style={styles.alumniInitial}>{(person.name || 'A').charAt(0)}</Text>
                </View>
                <View>
                  <Text style={[styles.alumniName, { color: theme.text }]}>{person.name}</Text>
                  <Text style={[styles.alumniPosition, { color: theme.textSecondary }]}>{person.position}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
        <TouchableOpacity style={[styles.applyButton, { backgroundColor: theme.tint }]} onPress={() => setShowApplyModal(true)}>
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showApplyModal} animationType="slide" transparent onRequestClose={() => setShowApplyModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Apply for {job.jobTitle || job.role || 'this job'}</Text>
              <TouchableOpacity onPress={() => setShowApplyModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <Text style={[styles.inputLabel, { color: theme.text }]}>Full Name *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Email *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter your phone number"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Cover Letter (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                value={coverLetter}
                onChangeText={setCoverLetter}
                placeholder="Tell us why you're a great fit..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />

              <Text style={[styles.inputLabel, { color: theme.text }]}>Resume *</Text>
              <TouchableOpacity style={[styles.uploadButton, { borderColor: theme.border }]} onPress={pickDocument}>
                <Ionicons name="document-attach-outline" size={20} color={theme.tint} />
                <Text style={[styles.uploadButtonText, { color: theme.text }]}>{resume ? resume.name : 'Upload Resume (PDF)'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton, { backgroundColor: theme.tint }]}
                onPress={handleSubmitApplication}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Submit Application</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} animationType="fade" transparent onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.successModal, { backgroundColor: theme.card }]}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>Application Submitted!</Text>
            <Text style={[styles.successText, { color: theme.textSecondary }]}>
              Your application has been successfully submitted to {job.company || 'the company'}. We'll notify you about the next steps.
            </Text>
            <TouchableOpacity
              style={[styles.successButton, { backgroundColor: theme.tint }]}
              onPress={() => {
                setShowSuccessModal(false)
                router.back()
              }}
            >
              <Text style={styles.successButtonText}>Back to Jobs</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 60, android: 40, default: 40 }),
    paddingBottom: 15,
  },
  backIcon: { padding: 5 },
  errorText: { fontSize: 16, marginBottom: 12 },
  backButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  backButtonText: { color: '#fff', fontWeight: '600' },
  content: { flex: 1 },
  companySection: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1 },
  companyIcon: { width: 80, height: 80, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  companyInitial: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  role: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5, paddingHorizontal: 20 },
  company: { fontSize: 16, marginBottom: 15 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 },
  infoItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10, marginVertical: 5 },
  infoText: { fontSize: 14, marginLeft: 5 },
  statsRow: { marginTop: 5 },
  statsText: { fontSize: 13 },
  section: { paddingHorizontal: 20, paddingVertical: 20, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  sectionText: { fontSize: 15, lineHeight: 22 },
  listItem: { flexDirection: 'row', marginBottom: 10 },
  bullet: { fontSize: 15, marginRight: 10, marginTop: 2 },
  listText: { flex: 1, fontSize: 15, lineHeight: 22 },
  alumniItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  alumniIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  alumniInitial: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  alumniName: { fontSize: 15, fontWeight: '600' },
  alumniPosition: { fontSize: 13 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  applyButton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  applyButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 12, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalBody: { paddingHorizontal: 16 },
  inputLabel: { marginTop: 12, marginBottom: 6, fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14 },
  textArea: { height: 120 },
  uploadButton: { marginTop: 8, borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  uploadButtonText: { marginLeft: 8 },
  submitButton: { marginTop: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  disabledButton: { opacity: 0.7 },
  successModal: { borderRadius: 12, padding: 20, alignItems: 'center' },
  successIcon: { marginBottom: 10 },
  successTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  successText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  successButton: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  successButtonText: { color: '#fff', fontWeight: '700' },
})


