import React from 'react'
import { Tabs } from 'expo-router'
import { useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'

export default function StudentTabsLayout() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? themes.dark : themes.light

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


