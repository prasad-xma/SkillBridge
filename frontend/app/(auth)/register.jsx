import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import React, { useMemo, useState } from 'react'
import axios from 'axios'
import Constants from 'expo-constants'
import RegisterSvg from '../../assets/auth/register_img.svg'

const PRIMARY = '#6c63ff'
const BG = '#ffffff'
const TEXT = '#111111'
const SUBTLE = '#666666'

const ROLE_OPTIONS = [
  { key: 'student', label: 'Student' },
  { key: 'institute', label: 'Institute' },
  { key: 'professional', label: 'Industry Professional' },
]

const API_BASE = Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

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

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {typeof RegisterSvg === 'function' ? (
          <RegisterSvg width={220} height={220} />
        ) : null}
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join SkillBridge to learn and connect</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          placeholderTextColor={SUBTLE}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          placeholderTextColor={SUBTLE}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={SUBTLE}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Text style={styles.label}>Role</Text>
        <View style={styles.roleRow}>
          {ROLE_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.roleChip, role === opt.key && styles.roleChipActive]}
              onPress={() => setRole(opt.key)}
            >
              <Text style={[styles.roleChipText, role === opt.key && styles.roleChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {roleFields.map(field => (
          <View key={field.name}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.label}
              placeholderTextColor={SUBTLE}
              value={profile[field.name] || ''}
              onChangeText={(t) => updateProfile(field.name, t)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
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
    color: TEXT,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: SUBTLE,
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
    color: SUBTLE,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT,
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
  roleChipActive: {
    backgroundColor: PRIMARY + '22',
    borderColor: PRIMARY,
  },
  roleChipText: {
    color: SUBTLE,
  },
  roleChipTextActive: {
    color: PRIMARY,
    fontWeight: '600',
  },
  button: {
    marginTop: 20,
    backgroundColor: PRIMARY,
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