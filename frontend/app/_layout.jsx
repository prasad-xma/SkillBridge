import { StyleSheet, View, useColorScheme } from 'react-native'
import React, { useCallback } from 'react'
import { Stack } from 'expo-router'
import { themes } from '../constants/colors'
import * as SplashScreen from 'expo-splash-screen' 

SplashScreen.preventAutoHideAsync().catch(() => {
  
})

const RootLayout = () => {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? themes.dark : themes.light

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
      </Stack>
    </View>
  )
}

export default RootLayout

const styles = StyleSheet.create({})