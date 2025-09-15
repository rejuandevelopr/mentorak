import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar]
)

// Only throw error in production or when not in test environment
if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
  throw new Error(
    `Missing required Firebase environment variables: ${missingEnvVars.join(', ')}`
  )
}

// Provide default values for development/test
const getEnvVar = (key: string, defaultValue = 'test-value') => 
  process.env[key] || defaultValue

const firebaseConfig = {
  apiKey: "AIzaSyCXFF4dwzUyZ3kjIMlhEtFnPU5Nj2BQV1Q",
  authDomain: "mentorak-3b433.firebaseapp.com",
  projectId: "mentorak-3b433",
  storageBucket: "mentorak-3b433.firebasestorage.app",
  messagingSenderId: "631629686770",
  appId: "1:631629686770:web:3bb7b630736deb025e6d6b",
}

// Initialize Firebase app with error handling
let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

try {
  // Initialize Firebase
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  
  // Initialize Firebase Authentication and get a reference to the service
  auth = getAuth(app)
  
  // Initialize Cloud Firestore and get a reference to the service
  db = getFirestore(app)
  
  // Initialize Firebase Storage and get a reference to the service
  storage = getStorage(app)
} catch (error) {
  console.error('Failed to initialize Firebase:', error)
  throw new Error('Firebase initialization failed. Please check your configuration.')
}

export { auth, db, storage }
export default app