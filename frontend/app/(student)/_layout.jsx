import React, { useEffect, useState } from 'react'
import { Tabs, router } from 'expo-router'
import { useColorScheme, View } from 'react-native'
import { themes } from '../../constants/colors'
import { getSession } from '../../lib/session'

export default function StudentTabsLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (!s || s.role !== 'student') {
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


