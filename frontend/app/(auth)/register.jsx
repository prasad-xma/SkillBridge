import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native'
import React, { useMemo, useState } from 'react'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import RegisterSvg from '../../assets/auth/register_img.svg'
import { themes } from '../../constants/colors'

const ROLE_OPTIONS = [
  { key: 'student', label: 'Student' },
  { key: 'institute', label: 'Institute' },
  { key: 'professional', label: 'Mentor' },
]

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

const Register = () => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [profile, setProfile] = useState({})
  const [loading, setLoading] = useState(false)

  const roleFields = useMemo(() => {
    switch (role) {
      case 'student':
        return [
          { name: 'institution', label: 'Institution' },
          { name: 'course', label: 'Course' },
          { name: 'year', label: 'Year' },
        ]
      case 'institute':
        return [
          { name: 'instituteName', label: 'Institute Name' },
          { name: 'address', label: 'Address' },
          { name: 'contactNumber', label: 'Contact Number' },
        ]
      case 'professional':
        return [
          { name: 'company', label: 'Company' },
          { name: 'title', label: 'Job Title' },
          { name: 'experienceYears', label: 'Years of Experience' },
        ]
      default:
        return []
    }
  }, [role])

  const onSubmit = async () => {
    if (!email || !password || !fullName) {
      Alert.alert('Missing info', 'Please fill all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, {
        email,
        password,
        fullName,
        role,
        profile,
      })
      if (res.status === 201) {
        Alert.alert('Success', 'Registration complete. You can now log in.')
        // Clear form fields after successful submission
        setFullName('')
        setEmail('')
        setPassword('')
        setRole('student')
        setProfile({})
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e.message
      Alert.alert('Registration failed', msg)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }))
  }

  const colorScheme = useColorScheme()
  const theme = useMemo(() => (colorScheme === 'dark' ? themes.dark : themes.light), [colorScheme])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {typeof RegisterSvg === 'function' ? (
          <RegisterSvg width={220} height={220} />
        ) : null}
        <Text style={[styles.title, { color: theme.text }]}>Create your account</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join SkillBridge to learn and connect</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          placeholder="John Doe"
          placeholderTextColor={theme.textSecondary}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          placeholder="name@example.com"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Password</Text>
        <TextInput
          style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
          placeholder="••••••••"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={[styles.label, { color: theme.textSecondary }]}>Role</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.roleChip, { backgroundColor: theme.card, borderColor: theme.border }, role === opt.key && { backgroundColor: theme.primary + '22', borderColor: theme.primary }]}
              onPress={() => setRole(opt.key)}
            >
              <Text style={[styles.roleChipText, { color: theme.textSecondary }, role === opt.key && { color: theme.primary, fontWeight: '600' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {roleFields.map(field => (
          <View key={field.name}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>{field.label}</Text>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
              placeholder={field.label}
              placeholderTextColor={theme.textSecondary}
              value={profile[field.name] || ''}
              onChangeText={(t) => updateProfile(field.name, t)}
            />
          </View>
        ))}

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

export default Register

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  hero: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 10,
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#666666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderColor: '#f0f0f0',
    borderWidth: 1,
  },
  label: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    color: '#666666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#fff'
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    backgroundColor: '#fff'
  },
  roleChipActive: {},
  roleChipText: {},
  roleChipTextActive: {},
  button: {
    marginTop: 20,
    backgroundColor: '#6c63ff',
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})