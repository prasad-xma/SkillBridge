import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { getSession } from '../../lib/session'

export default function InstituteHome() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    (async () => {
      const s = await getSession()
      setUser(s)
    })()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Institute Dashboard</Text>
      {user ? (
        <Text>Welcome, {user.fullName}</Text>
      ) : null}
      <Text>More institute features will be added by your teammate.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
})


