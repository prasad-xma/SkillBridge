import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, PanResponder, StyleSheet, Text, View, useColorScheme } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { themes } from '../../constants/colors'

const ToastContext = createContext({
  showToast: () => {},
  hideToast: () => {},
})

const TYPE_META = {
  success: {
    icon: 'checkmark-circle',
    fallbackTitle: 'Success',
    accentKey: 'toastSuccess',
  },
  error: {
    icon: 'alert-circle',
    fallbackTitle: 'Error',
    accentKey: 'toastError',
  },
  info: {
    icon: 'information-circle',
    fallbackTitle: 'Notice',
    accentKey: 'toastInfo',
  },
}

export const ToastProvider = ({ children }) => {
  const scheme = useColorScheme()
  const theme = scheme === 'dark' ? themes.dark : themes.light

  const [toast, setToast] = useState(null)
  const visibility = useRef(new Animated.Value(0)).current
  const dragOffset = useRef(new Animated.Value(0)).current
  const hideTimeout = useRef(null)

  const clearScheduledHide = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current)
      hideTimeout.current = null
    }
  }, [])

  const finishHide = useCallback(() => {
    setToast(null)
    visibility.setValue(0)
    dragOffset.setValue(0)
  }, [dragOffset, visibility])

  const hideToast = useCallback(() => {
    clearScheduledHide()
    Animated.parallel([
      Animated.timing(visibility, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(dragOffset, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      finishHide()
    })
  }, [clearScheduledHide, dragOffset, finishHide, visibility])

  const showToast = useCallback(({ type = 'info', title, message, duration = 3200 } = {}) => {
    clearScheduledHide()
    visibility.setValue(0)
    dragOffset.setValue(0)
    setToast({
      key: Date.now(),
      type: TYPE_META[type] ? type : 'info',
      title,
      message,
      duration,
    })
  }, [clearScheduledHide, dragOffset, visibility])

  useEffect(() => {
    if (!toast) return

    Animated.timing(visibility, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()

    if (toast.duration !== 0) {
      hideTimeout.current = setTimeout(() => {
        hideToast()
      }, toast.duration)
    }

    return () => {
      clearScheduledHide()
    }
  }, [toast, hideToast, clearScheduledHide, visibility])

  useEffect(() => () => clearScheduledHide(), [clearScheduledHide])

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 6,
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy < 0) {
        dragOffset.setValue(gestureState.dy)
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy < -60 || gestureState.vy < -1) {
        hideToast()
      } else {
        Animated.spring(dragOffset, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 0,
        }).start()
      }
    },
    onPanResponderTerminate: () => {
      Animated.spring(dragOffset, {
        toValue: 0,
        useNativeDriver: true,
        speed: 20,
        bounciness: 0,
      }).start()
    },
  }), [dragOffset, hideToast])

  const translateY = useMemo(() => (
    Animated.add(
      visibility.interpolate({
        inputRange: [0, 1],
        outputRange: [-120, 0],
      }),
      dragOffset,
    )
  ), [dragOffset, visibility])

  const meta = toast ? TYPE_META[toast.type] : null
  const accentColor = meta ? theme[meta.accentKey] : theme.toastInfo
  const backgroundColor = toast?.type === 'success'
    ? theme.toastSuccessBg
    : toast?.type === 'error'
      ? theme.toastErrorBg
      : theme.toastBase
  const displayTitle = toast?.title || meta?.fallbackTitle || 'Notice'

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast ? (
        <View pointerEvents="box-none" style={styles.overlay}>
          <Animated.View
            pointerEvents="box-none"
            style={[styles.toastPositioner, { transform: [{ translateY }] }]}
          >
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.toastCard,
                {
                  backgroundColor,
                  borderLeftColor: accentColor,
                  shadowColor: theme.toastShadow,
                },
              ]}
            >
              <View style={styles.toastContent}>
                <View style={styles.iconWrap}>
                  <Ionicons name={meta?.icon || TYPE_META.info.icon} size={20} color={accentColor} />
                </View>
                <View style={styles.textWrap}>
                  <Text style={[styles.title, { color: theme.toastText }]} numberOfLines={1}>{displayTitle}</Text>
                  {toast.message ? (
                    <Text style={[styles.message, { color: theme.toastText }]} numberOfLines={2}>{toast.message}</Text>
                  ) : null}
                </View>
              </View>
            </Animated.View>
          </Animated.View>
        </View>
      ) : null}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export default ToastProvider

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
    justifyContent: 'flex-start',
  },
  toastPositioner: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  toastCard: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
  },
})
