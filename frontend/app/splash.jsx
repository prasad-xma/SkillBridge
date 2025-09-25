import React, { useEffect } from 'react'
import { View, Image, StyleSheet, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { getSession } from '../lib/session'

const AppSplash = () => {
  const fadeAnim = new Animated.Value(0)
  const scaleAnim = new Animated.Value(0.8)

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Navigate after 2.5 seconds, respecting stored session
    const timer = setTimeout( async () => {
      const session = await getSession()
      await SplashScreen.hideAsync()
      if (session?.role === 'student') {
        router.replace('/(student)/home')
      } else {
        router.replace('/')
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/logo/logo_light.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 200,
    height: 200,
  },
})

export default AppSplash
