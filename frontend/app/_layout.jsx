import { StyleSheet, View, useColorScheme } from 'react-native'
import React, { useCallback } from 'react'
import { Stack } from 'expo-router'
import { themes } from '../constants/colors'
import * as SplashScreen from 'expo-splash-screen' 
import Constants from 'expo-constants'

SplashScreen.preventAutoHideAsync().catch(() => {
  
})

const RootLayout = () => {
  const colorScheme = useColorScheme()
  const forcedTheme = Constants?.expoConfig?.extra?.APP_THEME
  const effectiveScheme = forcedTheme ? forcedTheme : colorScheme
  const theme = effectiveScheme === 'dark' ? themes.dark : themes.light

  const onLayoutRootView = useCallback(async () => {
    try {
      await SplashScreen.hideAsync()
    } catch (e) {}
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }} onLayout={onLayoutRootView}>
      <Stack initialRouteName="splash">
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
        <Stack.Screen 
          name="(student)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(institute)" 
          options={{ 
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="(professional)" 
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