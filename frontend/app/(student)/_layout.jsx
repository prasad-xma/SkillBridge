import React, { useEffect, useState } from 'react'
import { Tabs, router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
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
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="questionnaire"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  )
}


