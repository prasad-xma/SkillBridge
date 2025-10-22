import React from 'react'
import { View, Text, StyleSheet, useColorScheme } from 'react-native'
import { themes } from '../../constants/colors'

export default function CoursesScreen() {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Courses coming soon!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
})
