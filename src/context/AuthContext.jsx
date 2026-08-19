import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

const GUEST_FLAG_KEY = 'healthsync_guest_mode'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isGuest, setIsGuest] = useState(
    () => localStorage.getItem(GUEST_FLAG_KEY) === 'true',
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isProfileLoading, setIsProfileLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user)

      if (user) {
        setIsProfileLoading(true)

        try {
          const profileRef = doc(db, 'users', user.uid)
          const profileSnapshot = await getDoc(profileRef)

          setUserProfile(
            profileSnapshot.exists() ? profileSnapshot.data() : null,
          )
        } catch {
          setUserProfile(null)
        }

        setIsProfileLoading(false)
      } else {
        setUserProfile(null)
        setIsProfileLoading(false)
      }

      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email, password) => {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    )

    setCurrentUser(credential.user)
    setUserProfile(null)
    setIsProfileLoading(false)
    localStorage.removeItem(GUEST_FLAG_KEY)
    setIsGuest(false)
  }

  const login = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password)
    localStorage.removeItem(GUEST_FLAG_KEY)
    setIsGuest(false)
  }

  const logout = async () => {
    await signOut(auth)
    setUserProfile(null)
    localStorage.removeItem(GUEST_FLAG_KEY)
    setIsGuest(false)
  }

  const continueAsGuest = () => {
    localStorage.setItem(GUEST_FLAG_KEY, 'true')
    setIsGuest(true)
  }

  const exitGuestMode = () => {
    localStorage.removeItem(GUEST_FLAG_KEY)
    setIsGuest(false)
  }

  const saveUserProfile = async (profileData) => {
    if (!currentUser) return

    const profileRef = doc(db, 'users', currentUser.uid)
    const completeProfile = { ...profileData, profileComplete: true }

    await setDoc(profileRef, completeProfile, { merge: true })
    setUserProfile(completeProfile)
  }

  const value = {
    currentUser,
    userProfile,
    isGuest,
    isLoading,
    isProfileLoading,
    isAuthenticated: Boolean(currentUser) || isGuest,
    profileComplete: isGuest || Boolean(userProfile?.profileComplete),
    signup,
    login,
    logout,
    continueAsGuest,
    exitGuestMode,
    saveUserProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}