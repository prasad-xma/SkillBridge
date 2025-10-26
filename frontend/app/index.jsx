import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { router } from 'expo-router'
import { getSession } from '../lib/session'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { 
  FadeIn, 
  FadeInUp, 
  FadeInDown, 
  SlideInLeft,
  SlideInRight,
  BounceIn,
  ZoomIn,
  StretchInX,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  runOnJS
} from 'react-native-reanimated'

const Home = () => {
  useEffect(() => {
    (async () => {
      const s = await getSession()
      if (s && s.role === 'student') {
        router.replace('/(student)/home')
      }
    })()
  }, [])

  const scaleValue = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleValue.value }]
    }
  })

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.95)
  }

  const handlePressOut = () => {
    scaleValue.value = withSpring(1)
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar style="light" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header Section */}
          <Animated.View 
            style={styles.header}
            entering={FadeInDown.duration(800).delay(200)}
          >
            <Animated.Text 
              entering={FadeInUp.duration(600).delay(400)}
              style={styles.welcomeText}
            >
              Welcome to
            </Animated.Text>
            <Animated.Text 
              entering={FadeInUp.duration(600).delay(600)}
              style={styles.appName}
            >
              SkillBridge
            </Animated.Text>
            <Animated.Text 
              entering={FadeInUp.duration(600).delay(800)}
              style={styles.tagline}
            >
              Connect, Learn, and Grow Your Career
            </Animated.Text>
          </Animated.View>

          {/* Hero Image Section */}
          <Animated.View 
            style={styles.heroContainer}
            entering={BounceIn.duration(1000).delay(1000)}
          >
            <View style={styles.heroImage}>
              <Animated.Text 
                entering={ZoomIn.duration(800).delay(1200)}
                style={styles.heroText}
              >
                🌟
              </Animated.Text>
            </View>
          </Animated.View>

          {/* Features Section */}
          <Animated.View 
            style={styles.featuresContainer}
            entering={FadeInUp.duration(800).delay(1400)}
          >
            <Animated.View 
              style={styles.featureItem}
              entering={SlideInLeft.duration(600).delay(1600)}
            >
              <Text style={styles.featureIcon}>🎯</Text>
              <Text style={styles.featureText}>Personalized Career Paths</Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeInUp.duration(600).delay(1800)}
            >
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>Skill Assessment</Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={SlideInRight.duration(600).delay(2000)}
            >
              <Text style={styles.featureIcon}>💼</Text>
              <Text style={styles.featureText}>Job Matching</Text>
            </Animated.View>
          </Animated.View>

          {/* Additional Feature Row */}
          <Animated.View 
            style={styles.featuresContainer}
            entering={FadeInUp.duration(800).delay(2200)}
          >
            <Animated.View 
              style={styles.featureItem}
              entering={SlideInLeft.duration(600).delay(2400)}
            >
              <Text style={styles.featureIcon}>🚀</Text>
              <Text style={styles.featureText}>Career Growth</Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={FadeInUp.duration(600).delay(2600)}
            >
              <Text style={styles.featureIcon}>🤝</Text>
              <Text style={styles.featureText}>Expert Mentors</Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.featureItem}
              entering={SlideInRight.duration(600).delay(2800)}
            >
              <Text style={styles.featureIcon}>📈</Text>
              <Text style={styles.featureText}>Progress Tracking</Text>
            </Animated.View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            style={styles.buttonContainer}
            entering={FadeInUp.duration(800).delay(3000)}
          >
            <Animated.View style={animatedStyle}>
              <TouchableOpacity 
                style={styles.primaryButton}
                onPress={() => router.push('/login')}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>Discover Your Path</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View
              entering={FadeIn.duration(600).delay(3200)}
            >
              <TouchableOpacity 
                style={styles.secondaryButton}
                onPress={() => router.push('/register')}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>
                  Start Your Journey Today! 🚀
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
    marginBottom: 8,
  },
  appName: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  heroContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  heroImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  heroText: {
    fontSize: 60,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
    padding: 8,
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  featureText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonContainer: {
    marginTop: 'auto',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#667eea',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'none',
  },
})