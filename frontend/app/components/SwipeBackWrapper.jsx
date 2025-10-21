import React, { useMemo } from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler'
import { router } from 'expo-router'

const SWIPE_THRESHOLD = 60
const VELOCITY_THRESHOLD = 400

export default function SwipeBackWrapper({ children, enabled = true, style }) {
  const panGesture = useMemo(() => {
    if (!enabled || Platform.OS !== 'ios') {
      return Gesture.Pan().onTouchesDown(() => {})
    }

    return Gesture.Pan()
      .activeOffsetX([-5, 1000])
      .onEnd((evt) => {
        if (evt.translationX > SWIPE_THRESHOLD && Math.abs(evt.velocityX) > VELOCITY_THRESHOLD) {
          if (router.canGoBack()) {
            router.back()
          }
        }
      })
  }, [enabled])

  if (!enabled || Platform.OS !== 'ios') {
    return <View style={style}>{children}</View>
  }

  return (
    <GestureHandlerRootView style={[styles.flex, style]}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.flex}>{children}</View>
      </GestureDetector>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
})
