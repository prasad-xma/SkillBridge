import { StyleSheet, View } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'

const AuthLayout = () => {
  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <Stack>
        <Stack.Screen 
          name="login" 
          options={{ 
            title: 'Login',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#6c63ff',
            },
            headerTintColor: '#ffffff',
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
              backgroundColor: '#6c63ff',
            },
            headerTintColor: '#ffffff',
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