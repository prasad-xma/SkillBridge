import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'skillbridge.session.v1'

export async function saveSession(session) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(session))
  } catch {}
}

export async function getSession() {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function clearSession() {
  try {
    await AsyncStorage.removeItem(KEY)
  } catch {}
}


