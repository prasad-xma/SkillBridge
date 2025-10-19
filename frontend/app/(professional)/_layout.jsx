import React, { useEffect, useState } from 'react'
import { Stack, router, Tabs } from 'expo-router'
import { getSession } from '../../lib/session'

export default function ProfessionalLayout() {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (!s || s.role !== 'professional') {
        router.replace('/login')
        return
      }
      setChecked(true)
    })()
  }, [])

  if (!checked) return null

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="network" options={{ title: 'Network' }} />
      <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  )
}


