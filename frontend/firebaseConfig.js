import { initializeApp, getApps, getApp } from 'firebase/app'
import { getStorage } from 'firebase/storage'
import { getFirestore } from 'firebase/firestore'
import Constants from 'expo-constants'
import { 
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
} from '@env'

const extra = (Constants?.expoConfig?.extra && Constants.expoConfig.extra.firebase) || {}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY || extra.apiKey,
  authDomain: FIREBASE_AUTH_DOMAIN || extra.authDomain,
  projectId: FIREBASE_PROJECT_ID || extra.projectId,
  storageBucket: FIREBASE_STORAGE_BUCKET || extra.storageBucket,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || extra.messagingSenderId,
  appId: FIREBASE_APP_ID || extra.appId,
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const storage = getStorage(app)
export const db = getFirestore(app)
export default app
