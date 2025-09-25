import { StyleSheet, View, useColorScheme } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { themes } from '../constants/colors'

const RootLayout = () => {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? themes.dark : themes.light

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack>
        <Stack.Screen 
          name="splash" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'SkillBridge',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false 
          }} 
        />
      </Stack>
    </View>
  )
}

export default RootLayout

const styles = StyleSheet.create({})