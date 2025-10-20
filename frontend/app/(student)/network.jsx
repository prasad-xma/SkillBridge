import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'

export default function StudentNetwork() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Your Network</Text>
      <Text style={{ color: theme.textSecondary }}>Connect with peers and mentors.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 42 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
})


