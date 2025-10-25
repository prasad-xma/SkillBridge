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
  Modal,
  Animated,
  Easing,
} from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons'

export default function StudentJobs() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [user, setUser] = useState(null)
  const [jobs, setJobs] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [applyForm, setApplyForm] = useState({ resumeUrl: '', coverLetter: '' })
  const [activeTab, setActiveTab] = useState('recommended') // 'recommended' or 'all'
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [modalScale] = useState(new Animated.Value(0))
  const [modalOpacity] = useState(new Animated.Value(0))

  const appliedJobMap = useMemo(() => {
    const map = {}
    applications.forEach((item) => {
      if (item?.jobId) map[item.jobId] = true
    })
    return map
  }, [applications])

  const getApiBase = () => ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE

  const showSuccessAlert = () => {
    setShowSuccessModal(true)
    // Reset animations
    modalScale.setValue(0)
    modalOpacity.setValue(0)
    
    // Animate in
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()

    // Auto hide after 3 seconds
    setTimeout(() => {
      hideSuccessAlert()
    }, 3000)
  }

  const hideSuccessAlert = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSuccessModal(false)
    })
  }

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

  const loadRecommendedJobs = useCallback(async (uid) => {
    if (!uid) return
    try {
      const API_BASE = getApiBase()
      if (!API_BASE) return
      const resp = await axios.get(`${API_BASE}/api/student/recommended-jobs`, { params: { uid } })
      const list = Array.isArray(resp.data) ? resp.data : []
      setRecommendedJobs(list)
    } catch (e) {
      console.log('Failed to load recommended jobs:', e?.message)
      // Fallback to empty array on error
      setRecommendedJobs([])
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
      await Promise.all([loadJobs(), loadRecommendedJobs(session.uid), loadApplications(session.uid)])
    })()
  }, [loadApplications, loadJobs, loadRecommendedJobs])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([
      loadJobs(),
      loadRecommendedJobs(user?.uid),
      loadApplications(user?.uid)
    ])
  }, [loadApplications, loadJobs, loadRecommendedJobs, user?.uid])

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
      showSuccessAlert()
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
    const isRecommended = recommendedJobs.some(job => job.id === item.id)
    
    return (
      <TouchableOpacity
        style={[styles.jobCard, { backgroundColor: theme.card, borderColor: theme.border }]}
        activeOpacity={0.85}
        onPress={() => setSelectedJob(item)}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.jobHeader}>
            <Text style={[styles.jobTitle, { color: theme.text }]}>{item.title}</Text>
            {isRecommended && (
              <View style={[styles.recommendedBadge, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="sparkles" size={12} color={theme.primary} />
                <Text style={[styles.recommendedText, { color: theme.primary }]}>Recommended</Text>
              </View>
            )}
          </View>
          
          <View style={styles.jobMeta}>
            {item.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.jobSubtitle, { color: theme.textSecondary }]}>{item.location}</Text>
              </View>
            ) : null}
            {item.experience ? (
              <View style={styles.metaItem}>
                <FontAwesome5 name="user-tie" size={12} color={theme.textSecondary} />
                <Text style={[styles.jobSubtitle, { color: theme.textSecondary }]}>{item.experience}</Text>
              </View>
            ) : null}
          </View>
          
          <View style={styles.chipRow}>
            {skills.slice(0, 4).map((skill) => (
              <View key={skill} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name="code-slash" size={10} color={theme.textSecondary} />
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.viewButton}>
          <Text style={{ color: theme.tint, fontWeight: '700', marginRight: 4 }}>View</Text>
          <Feather name="arrow-up-right" size={16} color={theme.tint} />
        </View>
      </TouchableOpacity>
    )
  }

  const currentJobs = activeTab === 'recommended' ? recommendedJobs : jobs

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={hideSuccessAlert}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.successModal,
              { 
                backgroundColor: theme.card,
                borderColor: theme.border,
                transform: [{ scale: modalScale }],
                opacity: modalOpacity,
              }
            ]}
          >
            <View style={[styles.successIconContainer, { backgroundColor: theme.primary + '20' }]}>
              <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.successTitle, { color: theme.text }]}>
              Application Submitted!
            </Text>
            <Text style={[styles.successMessage, { color: theme.textSecondary }]}>
              Your application has been sent to the recruiter.
            </Text>
            <TouchableOpacity 
              style={[styles.successButton, { backgroundColor: theme.primary }]}
              onPress={hideSuccessAlert}
              activeOpacity={0.8}
            >
              <Text style={styles.successButtonText}>Got it</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <View style={[styles.headerBar, { borderColor: theme.border }]}>
        <View style={styles.headerTitleRow}>
          <Ionicons name="briefcase-outline" size={24} color={theme.text} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>Jobs</Text>
        </View>
        
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'recommended' && { backgroundColor: theme.primary },
              { borderColor: theme.border }
            ]}
            onPress={() => setActiveTab('recommended')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="sparkles" 
              size={16} 
              color={activeTab === 'recommended' ? '#fff' : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'recommended' ? '#fff' : theme.textSecondary }
            ]}>
              Recommended ({recommendedJobs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'all' && { backgroundColor: theme.primary },
              { borderColor: theme.border }
            ]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="list" 
              size={16} 
              color={activeTab === 'all' ? '#fff' : theme.textSecondary} 
            />
            <Text style={[
              styles.tabText,
              { color: activeTab === 'all' ? '#fff' : theme.textSecondary }
            ]}>
              All Jobs ({jobs.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {!selectedJob ? (
        <View style={{ flex: 1 }}>
          {loading ? (
            <View style={styles.spinnerWrap}>
              <ActivityIndicator color={theme.primary} size="large" />
              <Text style={[styles.loadingText, { color: theme.textSecondary, marginTop: 12 }]}>
                Loading opportunities...
              </Text>
            </View>
          ) : currentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {activeTab === 'recommended' ? 'No recommended jobs' : 'No jobs yet'}
              </Text>
              <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                {activeTab === 'recommended' 
                  ? `We couldn't find jobs matching your course: ${user?.course || 'N/A'}. Try the "All Jobs" tab to see all available positions.`
                  : 'New opportunities will appear here once recruiters post roles.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={currentJobs}
              keyExtractor={(item) => item.id}
              renderItem={renderJobCard}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl 
                  refreshing={refreshing} 
                  onRefresh={onRefresh} 
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
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
              <Ionicons name="chevron-back" size={18} color={theme.text} />
              <Text style={{ color: theme.text, marginLeft: 4 }}>Back</Text>
            </TouchableOpacity>
            <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedJob.title}</Text>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.detailBody}>
            {selectedJob.location ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Location</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedJob.location}</Text>
                </View>
              </View>
            ) : null}
            {selectedJob.category ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialIcons name="category" size={16} color={theme.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Category</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedJob.category}</Text>
                </View>
              </View>
            ) : null}
            {selectedJob.experience ? (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <FontAwesome5 name="user-tie" size={14} color={theme.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Experience</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{selectedJob.experience}</Text>
                </View>
              </View>
            ) : null}

            <View style={{ marginTop: 16 }}>
              <View style={styles.sectionHeader}>
                <Ionicons name="code-slash" size={18} color={theme.text} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Skills Required</Text>
              </View>
              <View style={styles.chipRow}>
                {formatSkills(selectedJob.skills).map((skill) => (
                  <View key={skill} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Ionicons name="checkmark-circle" size={12} color={theme.primary} />
                    <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '600', marginLeft: 4 }}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {selectedJob.description ? (
              <View style={{ marginTop: 16 }}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={18} color={theme.text} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Job Description</Text>
                </View>
                <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{selectedJob.description}</Text>
              </View>
            ) : null}

            <View style={[styles.applyCard, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="send-outline" size={18} color={theme.text} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Apply for this Position</Text>
              </View>
              <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
                Share a resume link and short note to strengthen your application.
              </Text>
              
              <View style={styles.inputContainer}>
                <Ionicons name="link-outline" size={16} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={applyForm.resumeUrl}
                  onChangeText={(text) => setApplyForm((prev) => ({ ...prev, resumeUrl: text }))}
                  placeholder="Resume or portfolio URL"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
                />
              </View>
              
              <View style={styles.inputContainer}>
                <Ionicons name="create-outline" size={16} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                  value={applyForm.coverLetter}
                  onChangeText={(text) => setApplyForm((prev) => ({ ...prev, coverLetter: text }))}
                  placeholder="Cover letter or additional details"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  style={[styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
                />
              </View>
              
              <TouchableOpacity
                disabled={submitting || hasApplied}
                onPress={onApply}
                activeOpacity={0.9}
                style={[styles.applyBtn, { backgroundColor: hasApplied ? theme.border : theme.primary }]}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.applyBtnContent}>
                    <Ionicons 
                      name={hasApplied ? "checkmark-done" : "paper-plane-outline"} 
                      size={18} 
                      color="#fff" 
                    />
                    <Text style={styles.applyBtnText}>
                      {hasApplied ? 'Already Applied' : 'Submit Application'}
                    </Text>
                  </View>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
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
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  jobMeta: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobSubtitle: {
    fontSize: 13,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinnerWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  emptyState: {
    paddingHorizontal: 24,
    marginTop: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    flex: 1,
  },
  detailBody: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  detailIcon: {
    width: 24,
    alignItems: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
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
    gap: 12,
  },
  inputContainer: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 40,
    paddingVertical: 12,
    fontSize: 13,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 40,
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
    marginTop: 8,
  },
  applyBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  applyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  // New styles for success modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  successButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 120,
  },
  successButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
})