import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDHt61FyaFe0-ax4hZ2-jcd_UdTjbuxYjk",
  authDomain: "healthsync2-auth.firebaseapp.com",
  projectId: "healthsync2-auth",
  storageBucket: "healthsync2-auth.firebasestorage.app",
  messagingSenderId: "978125405298",
  appId: "1:978125405298:web:a28dac15a22cb4749b16eb"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)