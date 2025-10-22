import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, useColorScheme, TouchableOpacity, ScrollView, Alert } from 'react-native'
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

  const [form, setForm] = useState({
    title: '',
    location: '',
    category: '',
    skills: '', // comma-separated for simple UI
    experience: '',
    description: '',
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
      if (!recruiterId) return Alert.alert('Not authorized', 'Missing recruiter session')

      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      const payload = {
        title: form.title,
        location: form.location,
        category: form.category,
        skills: form.skills,
        experience: form.experience,
        description: form.description,
        recruiterId,
      }
      await axios.post(`${API_BASE}/api/recruiter/jobs`, payload)
      Alert.alert('Success', 'Job posted successfully')
      router.replace('/(recruiter)/jobs')
    } catch (e) {
      Alert.alert('Error', e?.response?.data?.message || e?.message || 'Failed to post job')
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

        {/* Upload button placeholder */}
        <TouchableOpacity style={[styles.uploadBtn, { borderColor: theme.border }]}> 
          <Text style={{ color: theme.text }}>Upload Logo/Docs</Text>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, styles.draft]} onPress={() => Alert.alert('Saved', 'Draft saved locally (placeholder)')}>
            <Text style={styles.actionText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.post]} onPress={onPost}>
            <Text style={styles.actionText}>Post Job</Text>
          </TouchableOpacity>
        </View>
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
})
