import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native'
import React, { useState } from 'react'
import axios from 'axios'
import Constants from 'expo-constants'
import { API_BASE as ENV_API_BASE } from '@env'
import LoginSvg from '../../assets/auth/login_img.svg'

const PRIMARY = '#6c63ff'
const BG = '#ffffff'
const TEXT = '#111111'
const SUBTLE = '#666666'

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
        const { role, fullName } = res.data
        Alert.alert('Welcome', `${fullName || 'User'} (${role || 'role'})`)
        // Clear fields after success
        setEmail('')
        setPassword('')
      }
    } catch (e) {
      const msg = e?.response?.data?.message || e.message
      Alert.alert('Login failed', msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: BG }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        {typeof LoginSvg === 'function' ? (
          <LoginSvg width={220} height={220} />
        ) : null}
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Log in to continue learning</Text>
      </View>

      <View style={styles.card}>
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

        <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
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