import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, useColorScheme, TouchableOpacity, ScrollView } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { router } from 'expo-router'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'

export default function RecruiterPostJob() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })

  const showToast = (message, type = 'info', duration = 2500) => {
    setToast({ visible: true, message, type })
    if (duration > 0) setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
  }

  const [form, setForm] = useState({
    title: '',
    location: '',
    category: '',
    skills: '', // comma-separated for simple UI
    experience: '',
    description: '',
    employmentType: '',
    salaryMin: '',
    salaryMax: '',
    status: 'published',
    remote: '', // true/false or empty
    benefits: '', // comma-separated
    applicationLink: '',
    screeningQuestions: '', // newline separated
  })

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      setChecked(true)
    })()
  }, [])

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onPost = async () => {
    try {
      const session = await getSession()
      const recruiterId = session?.uid
      if (!recruiterId) {
        showToast('Not authorized: missing recruiter session', 'error')
        return
      }

      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      if (!API_BASE) {
        showToast('API_BASE not set. Configure in frontend/.env or app.json', 'error')
        return
      }

      const payload = {
        title: form.title,
        location: form.location,
        category: form.category,
        skills: form.skills,
        experience: form.experience,
        description: form.description,
        recruiterId,
        employmentType: form.employmentType || undefined,
        salaryMin: form.salaryMin || undefined,
        salaryMax: form.salaryMax || undefined,
        status: form.status || undefined,
        remote: typeof form.remote === 'string' ? (form.remote.toLowerCase() === 'true') : !!form.remote,
        benefits: form.benefits,
        applicationLink: form.applicationLink || undefined,
        screeningQuestions: form.screeningQuestions,
      }
      await axios.post(`${API_BASE}/api/recruiter/jobs`, payload)
      showToast('Job posted successfully', 'success')
      setTimeout(() => router.replace('/(recruiter)/jobs'), 1200)
    } catch (e) {
      showToast(e?.response?.data?.message || e?.message || 'Failed to post job', 'error')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.headerBar, { borderColor: theme.border }]}> 
        <Text style={[styles.headerTitle, { color: theme.text }]}>Post New Job</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Job Title */}
        <Text style={[styles.label, { color: theme.text }]}>Job Title</Text>
        <TextInput
          value={form.title}
          onChangeText={(t) => onChange('title', t)}
          placeholder="e.g., Software Engineer"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Location */}
        <Text style={[styles.label, { color: theme.text }]}>Location</Text>
        <TextInput
          value={form.location}
          onChangeText={(t) => onChange('location', t)}
          placeholder="e.g., Bengaluru or Remote"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Category (simple text for now) */}
        <Text style={[styles.label, { color: theme.text }]}>Category</Text>
        <TextInput
          value={form.category}
          onChangeText={(t) => onChange('category', t)}
          placeholder="e.g., Engineering"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Skills */}
        <Text style={[styles.label, { color: theme.text }]}>Skills Required</Text>
        <TextInput
          value={form.skills}
          onChangeText={(t) => onChange('skills', t)}
          placeholder="e.g., React, Node, SQL"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Experience */}
        <Text style={[styles.label, { color: theme.text }]}>Experience</Text>
        <TextInput
          value={form.experience}
          onChangeText={(t) => onChange('experience', t)}
          placeholder="e.g., 2-4 years"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Description */}
        <Text style={[styles.label, { color: theme.text }]}>Description</Text>
        <TextInput
          value={form.description}
          onChangeText={(t) => onChange('description', t)}
          placeholder="Describe the role, responsibilities, and requirements"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={6}
          style={[styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Employment Type */}
        <Text style={[styles.label, { color: theme.text }]}>Employment Type</Text>
        <TextInput
          value={form.employmentType}
          onChangeText={(t) => onChange('employmentType', t)}
          placeholder="e.g., Full-time, Contract, Internship"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Salary Range */}
        <Text style={[styles.label, { color: theme.text }]}>Salary Min</Text>
        <TextInput
          value={form.salaryMin}
          onChangeText={(t) => onChange('salaryMin', t)}
          placeholder="e.g., 600000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />
        <Text style={[styles.label, { color: theme.text }]}>Salary Max</Text>
        <TextInput
          value={form.salaryMax}
          onChangeText={(t) => onChange('salaryMax', t)}
          placeholder="e.g., 1200000"
          keyboardType="numeric"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Remote */}
        <Text style={[styles.label, { color: theme.text }]}>Remote (true/false)</Text>
        <TextInput
          value={String(form.remote)}
          onChangeText={(t) => onChange('remote', t)}
          placeholder="true or false"
          autoCapitalize="none"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Status (Radio) */}
        <Text style={[styles.label, { color: theme.text }]}>Status</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[
            { key: 'published', label: 'Publish' },
            { key: 'archived', label: 'Archive' },
            { key: 'draft', label: 'Draft' },
          ].map(opt => (
            <TouchableOpacity key={opt.key} onPress={() => onChange('status', opt.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' }}>
                {form.status === opt.key ? (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#6c63ff' }} />
                ) : null}
              </View>
              <Text style={{ color: theme.text }}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Benefits */}
        <Text style={[styles.label, { color: theme.text }]}>Benefits</Text>
        <TextInput
          value={form.benefits}
          onChangeText={(t) => onChange('benefits', t)}
          placeholder="Comma-separated benefits (e.g., Health Insurance, ESOP)"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Application Link */}
        <Text style={[styles.label, { color: theme.text }]}>Application Link</Text>
        <TextInput
          value={form.applicationLink}
          onChangeText={(t) => onChange('applicationLink', t)}
          placeholder="https://..."
          autoCapitalize="none"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Screening Questions */}
        <Text style={[styles.label, { color: theme.text }]}>Screening Questions</Text>
        <TextInput
          value={form.screeningQuestions}
          onChangeText={(t) => onChange('screeningQuestions', t)}
          placeholder={"One question per line"}
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={4}
          style={[styles.textarea, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
        />

        {/* Upload button placeholder */}
        <TouchableOpacity style={[styles.uploadBtn, { borderColor: theme.border }]}> 
          <Text style={{ color: theme.text }}>Upload Logo/Docs</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.draft]} onPress={() => showToast('Draft saved locally (placeholder)', 'info')}>
            <Text style={styles.actionText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.post]} onPress={onPost}>
            <Text style={styles.actionText}>Post Job</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {toast.visible && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : toast.type === 'success' ? styles.toastSuccess : styles.toastInfo]}>
          <Text style={styles.toastText}>{toast.message}</Text>
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
    fontSize: 18,
    fontWeight: '800',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  uploadBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
  },
  draft: {
    backgroundColor: '#e5e7eb',
  },
  post: {
    backgroundColor: '#6c63ff',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '800',
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
    fontWeight: '800',
  },
})
