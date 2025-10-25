import React, { useEffect, useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useColorScheme, ScrollView } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession, saveSession } from '../../lib/session'
import { router } from 'expo-router'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'

export default function RecruiterEditProfile() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' })
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    roleTitle: '',
    organization: '',
    phone: '',
  })

  const showToast = (message, type = 'info', duration = 2000) => {
    setToast({ visible: true, message, type })
    if (duration > 0) setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration)
  }

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        router.replace('/login')
        return
      }
      // Prefill from session immediately
      const sp = session.profile || {}
      setForm((prev) => ({
        fullName: session.fullName || prev.fullName || '',
        email: session.email || prev.email || '',
        roleTitle: sp.roleTitle || prev.roleTitle || '',
        organization: sp.organization || sp.company || prev.organization || '',
        phone: sp.phone || sp.contactNumber || prev.phone || '',
      }))
      const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE
      try {
        if (API_BASE) {
          const resp = await axios.get(`${API_BASE}/api/recruiter/profile`, { params: { recruiterId: session.uid } })
          const data = resp?.data || {}
          const p = data.profile || {}
          setForm((prev) => ({
            fullName: data.fullName || prev.fullName || '',
            email: data.email || prev.email || '',
            roleTitle: p.roleTitle || data.roleTitle || prev.roleTitle || '',
            organization: p.organization || p.company || prev.organization || '',
            phone: p.phone || p.contactNumber || prev.phone || '',
          }))
        }
      } catch (_) {
        // ignore
      } finally {
        setChecked(true)
      }
    })()
  }, [])

  if (!checked) return <View style={{ flex: 1, backgroundColor: theme.background }} />

  const onChange = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const onSave = async () => {
    try {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
        showToast('Not authorized', 'error')
        return
      }
      const updated = {
        ...session,
        fullName: form.fullName || session.fullName,
        email: form.email || session.email,
        // keep role as session.role; roleTitle can live in profile
        profile: {
          ...(session.profile || {}),
          roleTitle: form.roleTitle,
          organization: form.organization,
          phone: form.phone,
        },
      }
      await saveSession(updated)
      showToast('Profile updated', 'success')
      setTimeout(() => router.replace('/(recruiter)/profile'), 900)
    } catch (e) {
      showToast('Failed to update locally', 'error')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.headerBar, { borderColor: theme.border }]}> 
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={[styles.label, { color: theme.text }]}>Full Name</Text>
        <TextInput value={form.fullName} onChangeText={(t) => onChange('fullName', t)} placeholder="Full name" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} />

        <Text style={[styles.label, { color: theme.text }]}>Email</Text>
        <TextInput value={form.email} onChangeText={(t) => onChange('email', t)} placeholder="Email" autoCapitalize='none' keyboardType='email-address' placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} />

        <Text style={[styles.label, { color: theme.text }]}>Role Title</Text>
        <TextInput value={form.roleTitle} onChangeText={(t) => onChange('roleTitle', t)} placeholder="e.g., HR Manager" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} />

        <Text style={[styles.label, { color: theme.text }]}>Organization</Text>
        <TextInput value={form.organization} onChangeText={(t) => onChange('organization', t)} placeholder="Organization" placeholderTextColor={theme.textSecondary} style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} />

        <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
        <TextInput value={form.phone} onChangeText={(t) => onChange('phone', t)} placeholder="Phone" placeholderTextColor={theme.textSecondary} keyboardType='phone-pad' style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]} />

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
          <TouchableOpacity style={[styles.actionBtn, styles.cancel]} onPress={() => router.back()}>
            <Text style={styles.actionTextDark}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.save]} onPress={onSave}>
            <Text style={styles.actionText}>Save Changes</Text>
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
  headerTitle: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  textarea: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, minHeight: 100, textAlignVertical: 'top' },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
  cancel: { backgroundColor: '#e5e7eb' },
  save: { backgroundColor: '#111827' },
  actionText: { color: '#ffffff', fontWeight: '800' },
  actionTextDark: { color: '#111827', fontWeight: '800' },
  toast: { position: 'absolute', bottom: 24, left: 16, right: 16, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center' },
  toastInfo: { backgroundColor: '#111827' },
  toastSuccess: { backgroundColor: '#16a34a' },
  toastError: { backgroundColor: '#dc2626' },
  toastText: { color: '#ffffff', fontWeight: '800' },
})
