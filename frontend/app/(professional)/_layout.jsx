import React, { useEffect, useState } from 'react'
import { Tabs, router } from 'expo-router'
import { useColorScheme, View } from 'react-native'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

export default function ProfessionalLayout() {
  const [checked, setChecked] = useState(false)
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light

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

  if (!checked) {
    return <View style={{ flex: 1, backgroundColor: theme.background }} />
  }

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


