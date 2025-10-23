import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native'
import React, { useMemo, useState } from 'react'
import { Link } from 'expo-router'

import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import LoginSvg from '../../assets/auth/login_img.svg'
import { themes } from '../../constants/colors'
import { saveSession } from '../../lib/session'
import { router } from 'expo-router'

const API_BASE = ENV_API_BASE || Constants?.expoConfig?.extra?.API_BASE || 'http://localhost:5000'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password })
      if (res.status === 200) {
        const { role } = res.data
        await saveSession(res.data)
        if (role === 'student') {
          router.replace('/(student)/home')
        } else if (role === 'institute') {
          router.replace('/(institute)/home')
        } else if (role === 'professional') {
          router.replace('/(professional)/home')
        } else if (role === 'recruiter') {
          router.replace('/(recruiter)/home')
        } else {
          Alert.alert('Login', 'Logged in')
        }
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e.message
      Alert.alert('Login failed', msg)
    } finally {
      setLoading(false)
    }
  }

  const colorScheme = useColorScheme()
  const theme = useMemo(() => (colorScheme === 'dark' ? themes.dark : themes.light), [colorScheme])

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {typeof LoginSvg === 'function' ? (
          <LoginSvg width={220} height={220} />
        ) : null}
        <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Log in to continue learning</Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
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

        <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <View style={styles.linkRow}>
          <Text style={[styles.linkLabel, { color: theme.textSecondary }]}>Don't have an account?</Text>
          <Link href="/(auth)/register" style={[styles.linkText, { color: theme.primary }]}>Register</Link>
        </View>
      </View>
    </ScrollView>
  )
}

export default Login

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
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginTop: 16,
  },
  linkLabel: {
    fontSize: 14,
    color: '#666666',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c63ff',
  },
})