import React, { useEffect, useState } from 'react'
import { Tabs, router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useColorScheme, View } from 'react-native'
import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

export default function RecruiterTabsLayout() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    (async () => {
      const session = await getSession()
      if (!session || session.role !== 'recruiter') {
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
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
      {/** Hidden route for posting a job (navigated via router.push), not shown in tab bar */}
      <Tabs.Screen
        name="post-job"
        options={{
          href: null,
        }}
      />
      {/** Hidden route for editing a job */}
      <Tabs.Screen
        name="edit-job"
        options={{
          href: null,
        }}
      />
    </Tabs>
  )
}
