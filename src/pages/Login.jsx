import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

function getAuthErrorMessage(error) {
  const code = error?.code || ''

  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists.'
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Incorrect email or password.'
  }

  if (code === 'auth/weak-password') {
    return 'Password should be at least 6 characters.'
  }

  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address.'
  }

  if (code === 'auth/user-not-found') {
    return 'No account was found with this email.'
  }

  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection.'
  }

  return 'Something went wrong. Please try again.'
}

function Login() {
  const navigate = useNavigate()

  const {
    signup,
    login,
    continueAsGuest,
    isAuthenticated,
  } = useAuth()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/onboarding')
    }
  }, [isAuthenticated, navigate])

  const isSignUp = mode === 'signup'

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setIsLoading(true)

    try {
      if (isSignUp) {
        await signup(email.trim(), password)
      } else {
        await login(email.trim(), password)
      }

      navigate('/onboarding')
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
    } finally {
      setIsLoading(false)
    }
  }

  const switchMode = () => {
    setMode((currentMode) =>
      currentMode === 'login' ? 'signup' : 'login',
    )
    setError('')
  }

  const handleGuestContinue = () => {
    continueAsGuest()
    navigate('/')
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>

          <p>
            {isSignUp
              ? 'Create an account to keep your HealthSync data with you.'
              : 'Log in to continue to your personal health companion.'}
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field">
            Email

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="login-field">
            Password

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              minLength="6"
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="login-submit-button"
            type="submit"
            disabled={isLoading}
          >
            {isLoading
              ? 'Please wait...'
              : isSignUp
                ? 'Create Account'
                : 'Log In'}
          </button>
        </form>

        <button
          className="login-toggle"
          type="button"
          onClick={switchMode}
        >
          {isSignUp
            ? 'Already have an account? Log in'
            : "Don't have an account? Sign up"}
        </button>

        <div className="login-guest-section">
          <p>Want to explore HealthSync first?</p>

          <button
            className="login-guest-button"
            type="button"
            onClick={handleGuestContinue}
          >
            Continue as Guest
          </button>
        </div>
      </section>
    </main>
  )
}

export default Login