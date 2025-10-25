import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'
import { useLocalSearchParams, router } from 'expo-router'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'

export default function RecruiterEditJob() {
  const { id } = useLocalSearchParams()
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    title: '',
    location: '',
    category: '',
    skills: '',
    experience: '',
    description: '',
    employmentType: '',
    salaryMin: '',
    salaryMax: '',
    status: 'published',
    remote: '',
    benefits: '',
    applicationLink: '',
    screeningQuestions: '',
  })

  const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      setChecked(true)
      try {
        const resp = await axios.get(`${API_BASE}/api/recruiter/jobs/${id}`)
        const j = resp.data || {}
        setForm({
          title: j.title || '',
          location: j.location || '',
          category: j.category || '',
          skills: Array.isArray(j.skills) ? j.skills.join(', ') : (j.skills || ''),
          experience: j.experience || '',
          description: j.description || '',
          employmentType: j.employmentType || '',
          salaryMin: (j.salaryMin != null ? String(j.salaryMin) : ''),
          salaryMax: (j.salaryMax != null ? String(j.salaryMax) : ''),
          status: j.status || 'published',
          remote: j.remote != null ? String(!!j.remote) : '',
          benefits: Array.isArray(j.benefits) ? j.benefits.join(', ') : (j.benefits || ''),
          applicationLink: j.applicationLink || '',
          screeningQuestions: Array.isArray(j.screeningQuestions) ? j.screeningQuestions.join('\n') : (j.screeningQuestions || ''),
        })
      } catch (e) {
        Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to load job')
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onUpdate = async () => {
    try {
      const payload = {
        title: form.title,
        location: form.location,
        category: form.category,
        skills: form.skills,
        experience: form.experience,
        description: form.description,
        employmentType: form.employmentType || undefined,
        salaryMin: form.salaryMin || undefined,
        salaryMax: form.salaryMax || undefined,
        status: form.status || undefined,
        remote: typeof form.remote === 'string' ? (form.remote.toLowerCase() === 'true') : !!form.remote,
        benefits: form.benefits,
        applicationLink: form.applicationLink || undefined,
        screeningQuestions: form.screeningQuestions,
      }
      await axios.put(`${API_BASE}/api/recruiter/jobs/${id}`, payload)
      Alert.alert('Updated', 'Job updated successfully')
      router.back()
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to update job')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* Header */}
      <View style={[styles.headerBar, { borderColor: theme.border }]}> 
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Job</Text>
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

        {/* Category */}
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

        {/* Actions */}
        <TouchableOpacity style={[styles.actionBtn, styles.post]} onPress={onUpdate}>
          <Text style={styles.actionText}>Update Job</Text>
        </TouchableOpacity>
      </ScrollView>
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
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
  },
  post: {
    backgroundColor: '#6c63ff',
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '800',
  },
})
