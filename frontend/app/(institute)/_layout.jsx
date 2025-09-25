import React, { useEffect, useState } from 'react'
import { Stack, router } from 'expo-router'
import { getSession } from '../../lib/session'

export default function InstituteLayout() {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (!s || s.role !== 'institute') {
        router.replace('/login')
        return
      }
      setChecked(true)
    })()
  }, [])

  if (!checked) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="home" />
    </Stack>
  )
}


