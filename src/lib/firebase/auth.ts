import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  User,
  UserCredential,
} from 'firebase/auth'
import { auth } from './config'
import { ErrorHandler } from '@/lib/errors/errorHandler'
import { withRetry } from '@/lib/utils/retry'

export const signUp = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await withRetry(
      () => createUserWithEmailAndPassword(auth, email, password),
      { maxAttempts: 2 }
    )
  } catch (error) {
    const appError = ErrorHandler.handleError(error, { operation: 'signUp', email })
    ErrorHandler.logError(appError)
    throw appError
  }
}

export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  try {
    return await withRetry(
      () => signInWithEmailAndPassword(auth, email, password),
      { maxAttempts: 2 }
    )
  } catch (error) {
    const appError = ErrorHandler.handleError(error, { operation: 'signIn', email })
    ErrorHandler.logError(appError)
    throw appError
  }
}

export const signOut = async (): Promise<void> => {
  try {
    await withRetry(
      () => firebaseSignOut(auth),
      { maxAttempts: 2 }
    )
  } catch (error) {
    const appError = ErrorHandler.handleError(error, { operation: 'signOut' })
    ErrorHandler.logError(appError)
    throw appError
  }
}

export const signInWithGoogle = async (): Promise<UserCredential> => {
  try {
    const provider = new GoogleAuthProvider()
    provider.addScope('email')
    provider.addScope('profile')
    
    return await withRetry(
      () => signInWithPopup(auth, provider),
      { maxAttempts: 2 }
    )
  } catch (error) {
    const appError = ErrorHandler.handleError(error, { operation: 'signInWithGoogle' })
    ErrorHandler.logError(appError)
    throw appError
  }
}

export const getCurrentUser = (): User | null => {
  return auth.currentUser
}