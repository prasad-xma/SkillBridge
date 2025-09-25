import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const RootLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
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