import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Slot } from 'expo-router';

const RootLayout = () => {
  return (
    <View>
      <Slot />
      <Text>RootLayout</Text>
    </View>
  )
}

export default RootLayout

const styles = StyleSheet.create({})