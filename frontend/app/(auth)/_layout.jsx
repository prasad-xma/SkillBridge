import { StyleSheet, View, useColorScheme } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import { themes } from '../../constants/colors'

const AuthLayout = () => {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? themes.dark : themes.light

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