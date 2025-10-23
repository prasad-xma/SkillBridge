import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import { themes } from '../../constants/colors'
import { getSession, clearSession, saveSession } from '../../lib/session'
import { router } from 'expo-router'
import { useToast } from '../components/ToastProvider'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

export default function StudentProfile() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [user, setUser] = useState(null)
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullNameField, setFullNameField] = useState('')
  const [institution, setInstitution] = useState('')
  const [course, setCourse] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
    })()
  }, [])

  const onLogout = async () => {
    await clearSession()
    router.replace('/login')
  }

  const startEdit = () => {
    if (!user) return
    setFullNameField(user?.fullName || '')
    const p = user?.profile || {}
    setInstitution(String(p?.institution || ''))
    setCourse(String(p?.course || ''))
    setYear(String(p?.year || ''))
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
  }

  const onSave = async () => {
    if (!user?.uid) {
      showToast({ type: 'error', title: 'Update failed', message: 'Missing user id' })
      return
    }

    const trimmedName = (fullNameField || '').trim()
    const currentProfile = user?.profile || {}
    const nextProfile = {
      ...currentProfile,
      institution,
      course,
      year,
    }

    const profileChanged =
      (nextProfile.institution || '') !== (currentProfile.institution || '') ||
      (nextProfile.course || '') !== (currentProfile.course || '') ||
      (nextProfile.year || '') !== (currentProfile.year || '')

    const body = { uid: user.uid }
    if (trimmedName && trimmedName !== (user.fullName || '')) body.fullName = trimmedName
    if (profileChanged) body.profile = nextProfile

    if (!body.fullName && !body.profile) {
      showToast({ type: 'info', title: 'No changes', message: 'Nothing to update.' })
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const res = await axios.put(`${API_BASE}/api/student/profile`, body)
      let updatedUser = { ...user }
      if (res.status === 200 && res.data?.user) {
        const u = res.data.user
        updatedUser = { ...updatedUser, fullName: u.fullName ?? updatedUser.fullName, profile: u.profile ?? nextProfile }
      } else {
        updatedUser = { ...updatedUser, fullName: trimmedName || updatedUser.fullName, profile: nextProfile }
      }
      setUser(updatedUser)
      await saveSession(updatedUser)
      showToast({ type: 'success', title: 'Profile updated' })
      setEditing(false)
    } catch (e) {
      const msg = e?.response?.data?.message || e.message
      showToast({ type: 'error', title: 'Update failed', message: msg })
    } finally {
      setSaving(false)
    }
  }

  const initials = useMemo(() => {
    const name = user?.fullName || ''
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'ST'
  }, [user?.fullName])

  const renderField = (label, value) => {
    if (!value && value !== 0) return null
    return (
      <View style={styles.row}>
        <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text>
      </View>
    )
  }

  const profile = user?.profile || {}

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      keyboardDismissMode="on-drag"
      nestedScrollEnabled
    > 
      <View style={[styles.headerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
        <View style={[styles.avatar, { backgroundColor: theme.tint + '22', borderColor: theme.tint + '44' }]}> 
          <Text style={[styles.avatarText, { color: theme.tint }]}>{initials}</Text> 
        </View> 
        <View style={{ flex: 1 }}> 
          <Text style={[styles.name, { color: theme.text }]}>{user?.fullName || 'Student'}</Text> 
          <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || '—'}</Text> 
          {user?.role ? (
            <View style={[styles.roleChip, { borderColor: theme.accent + '66', backgroundColor: theme.accent + '14' }]}> 
              <View style={[styles.roleDot, { backgroundColor: theme.accent }]} />
              <Text style={[styles.roleText, { color: theme.accent }]}>{String(user.role).toUpperCase()}</Text>
            </View>
          ) : null}
        </View> 
      </View> 

      <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text> 
        <View style={styles.divider} />
        {renderField('Email', user?.email)} 
        {renderField('Role', user?.role)} 

        {Object.keys(profile).length > 0 ? ( 
          <View style={{ marginTop: 18 }}> 
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text> 
            <View style={styles.divider} />
            {Object.entries(profile).map(([key, val]) => {
              const value = Array.isArray(val) ? val.filter(Boolean) : val
              if (Array.isArray(value) && value.length > 0) {
                return (
                  <View key={key} style={styles.row}> 
                    <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text> 
                    <View style={styles.chipsRow}>
                      {value.map((item, idx) => (
                        <View key={idx} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
                          <Text style={[styles.chipText, { color: theme.text }]}>{String(item)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              }
              return (
                <View key={key} style={styles.row}> 
                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{key}</Text> 
                  <Text style={[styles.fieldValue, { color: theme.text }]}>{String(value)}</Text> 
                </View>
              )
            })} 
          </View> 
        ) : null} 
      </View> 

      {!editing ? (
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.secondary }]} onPress={startEdit}> 
          <Text style={{ color: '#fff', fontWeight: '700' }}>Edit Profile</Text> 
        </TouchableOpacity> 
      ) : (
        <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 16 }]}> 
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Edit Profile</Text> 
          <View style={styles.divider} />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Full Name</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="Full Name"
            placeholderTextColor={theme.textSecondary}
            value={fullNameField}
            onChangeText={setFullNameField}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Institution</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="Institution"
            placeholderTextColor={theme.textSecondary}
            value={institution}
            onChangeText={setInstitution}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Course</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="Course"
            placeholderTextColor={theme.textSecondary}
            value={course}
            onChangeText={setCourse}
          />

          <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Year</Text>
          <TextInput
            style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
            placeholder="Year"
            placeholderTextColor={theme.textSecondary}
            value={year}
            onChangeText={setYear}
          />

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, flex: 1, opacity: saving ? 0.7 : 1 }]} onPress={onSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, { backgroundColor: theme.border, flex: 1 }]} onPress={cancelEdit} disabled={saving}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary, marginTop: 12 }]} onPress={onLogout}> 
        <Text style={{ color: '#fff', fontWeight: '700' }}>Logout</Text> 
      </TouchableOpacity> 
    </ScrollView>
    </KeyboardAvoidingView> 
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingTop: 42, paddingBottom: 40 },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 14,
  },
  roleChip: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800' },
  name: { fontSize: 18, fontWeight: '800' },
  email: { fontSize: 13, marginTop: 2 },

  detailsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: '#00000011', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  fieldLabel: { fontSize: 13 },
  fieldValue: { fontSize: 13, fontWeight: '700' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, maxWidth: '60%', justifyContent: 'flex-end' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, marginTop: 6, marginBottom: 10 },

  button: { marginTop: 24, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
})


