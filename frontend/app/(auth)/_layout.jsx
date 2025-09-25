import { StyleSheet, View, useColorScheme } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { themes } from '../../constants/colors'
import Constants from 'expo-constants'

const AuthLayout = () => {
  const colorScheme = useColorScheme()
  const forcedTheme = Constants?.expoConfig?.extra?.APP_THEME
  const effectiveScheme = forcedTheme ? forcedTheme : colorScheme
  const theme = effectiveScheme === 'dark' ? themes.dark : themes.light

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <Stack>
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Login',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.primary,
            },
            headerTintColor: theme.headerText,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
        <Stack.Screen 
          name="register" 
          options={{ 
            title: 'Register',
            headerShown: true,
            headerStyle: {
              backgroundColor: theme.primary,
            },
            headerTintColor: theme.headerText,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }} 
        />
      </Stack>
    </View>
  )
}

export default AuthLayout

const styles = StyleSheet.create({})