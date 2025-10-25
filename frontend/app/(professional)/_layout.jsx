import React, { useEffect, useMemo, useState } from 'react'
import { router, Tabs } from 'expo-router'
import { useColorScheme, View, Text } from 'react-native'

import { getSession } from '../../lib/session'
import { themes } from '../../constants/colors'

export default function ProfessionalLayout() {
  const [checked, setChecked] = useState(false)
  const scheme = useColorScheme()

  const theme = useMemo(() => (scheme === 'dark' ? themes.dark : themes.light), [scheme])

  


  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (!s || !['professional', 'mentor'].includes(s.role)) {
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
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 12,
          height: 60,
          backgroundColor: theme.card,
          borderTopColor: 'transparent',
          borderRadius: 16,
          paddingHorizontal: 8,
          paddingTop: 6,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 6,
        },
        tabBarItemStyle: { paddingVertical: 6 },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconLabel emoji="🏠" label="Home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="badges"
        options={{
          title: 'Badges',
          tabBarIcon: ({ color, focused }) => (
            <IconLabel emoji="🏅" label="Badges" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color, focused }) => (
            <IconLabel emoji="📈" label="Progress" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="certificates"
        options={{
          title: 'Certificates',
          tabBarIcon: ({ color, focused }) => (
            <IconLabel emoji="🎓" label="Certs" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Reminders',
          tabBarIcon: ({ color, focused }) => (
            <IconLabel emoji="⏰" label="Remind" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <IconLabel emoji="👤" label="Profile" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}


// Lightweight icon+label for the tab bar using emoji (no extra deps)
function IconLabel({ emoji, label, color, focused }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, lineHeight: 18 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color }}>{label}</Text>
      {focused ? <View style={{ width: 16, height: 3, backgroundColor: color, borderRadius: 9999, marginTop: 4 }} /> : null}
    </View>
  )
}

