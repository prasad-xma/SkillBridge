import { StyleSheet, Text, View, Button } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const Home = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home Page</Text>
      <Button title="Go to Register" onPress={() => router.push('/register')} />
      <Button title="Go to Login" onPress={() => router.push('/login')} />
    </View>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold'
  }
})