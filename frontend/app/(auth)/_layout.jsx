import React, { useEffect } from 'react'
import { Stack, router } from 'expo-router'
import { getSession } from '../../lib/session'

export default function AuthLayout() {
  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (s && s.role === 'student') {
        router.replace('/(student)/home')
      }
    })()
  }, [])
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  )
}