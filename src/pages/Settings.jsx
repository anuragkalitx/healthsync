import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import {
  deleteUser,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../context/AuthContext'
import './Settings.css'

const THEME_KEY = 'healthsync_theme'

const emptyProfile = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  height: '',
  weight: '',
  bloodGroup: '',
  allergies: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelationship: '',
  primaryLanguage: '',
  primaryPhysicianName: '',
  primaryPhysicianPhone: '',
}

function applyTheme(theme) {
  const systemTheme = window.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches
    ? 'dark'
    : 'light'

  document.documentElement.dataset.theme =
    theme === 'system' ? systemTheme : theme
}

function Settings() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const [profile, setProfile] = useState(emptyProfile)
  const [profileBeforeEditing, setProfileBeforeEditing] =
    useState(emptyProfile)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || 'light',
  )
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser?.uid) {
        setIsLoadingProfile(false)
        return
      }

      try {
        const profileDocument = await getDoc(
          doc(db, 'users', currentUser.uid),
        )

        if (profileDocument.exists()) {
          setProfile((current) => ({
            ...current,
            ...profileDocument.data(),
          }))
        }
      } catch {
        setError('Could not load your profile details.')
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [currentUser])

  const updateProfile = (field, value) => {
    setProfile((current) => ({
      ...current,
      [field]: value,
    }))

    setMessage('')
    setError('')
  }

  const handleStartEditingProfile = () => {
    setProfileBeforeEditing(profile)
    setIsEditingProfile(true)
  }

  const handleCancelEditingProfile = () => {
    setProfile(profileBeforeEditing)
    setIsEditingProfile(false)
  }

  const handleSaveProfile = async (event) => {
    event.preventDefault()

    if (!currentUser?.uid) {
      setError('Please log in to save your profile.')
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      await setDoc(
        doc(db, 'users', currentUser.uid),
        {
          ...profile,
          height: profile.height ? Number(profile.height) : null,
          weight: profile.weight ? Number(profile.weight) : null,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )

      setMessage('Profile saved successfully.')
      setIsEditingProfile(false)
    } catch {
      setError('Could not save your profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!currentUser?.email) {
      setError('No email address is available for this account.')
      return
    }

    setMessage('')
    setError('')

    try {
      await sendPasswordResetEmail(auth, currentUser.email)
      setMessage(`A password reset link was sent to ${currentUser.email}.`)
    } catch {
      setError('Could not send the password reset email.')
    }
  }

  const handleExport = async () => {
    setMessage('')
    setError('')

    try {
      let firestoreProfile = profile

      if (currentUser?.uid) {
        const profileDocument = await getDoc(
          doc(db, 'users', currentUser.uid),
        )

        if (profileDocument.exists()) {
          firestoreProfile = profileDocument.data()
        }
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: firestoreProfile,
        records: JSON.parse(
          localStorage.getItem('healthsync_records') || '[]',
        ),
        medications: JSON.parse(
          localStorage.getItem('healthsync_medications') || '[]',
        ),
      }

      const blob = new Blob(
        [JSON.stringify(exportData, null, 2)],
        { type: 'application/json' },
      )

      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = 'healthsync-health-records.json'

      document.body.appendChild(link)
      link.click()
      link.remove()

      URL.revokeObjectURL(downloadUrl)

      setMessage('Your HealthSync data export has downloaded.')
    } catch {
      setError('Could not export your data. Please try again.')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Delete your account and all local HealthSync data? This cannot be undone.',
    )

    if (!confirmed) return

    setMessage('')
    setError('')

    try {
      if (currentUser?.uid) {
        await deleteDoc(doc(db, 'users', currentUser.uid))
      }

      Object.keys(localStorage).forEach((key) => {
        if (
          key === 'healthsync_records' ||
          key === 'healthsync_medications' ||
          key.startsWith('healthsync_taken_')
        ) {
          localStorage.removeItem(key)
        }
      })

      if (auth.currentUser) {
        await deleteUser(auth.currentUser)
      }

      navigate('/login')
    } catch (deleteError) {
      console.error('Account deletion failed:', deleteError)

      setError(
        'Could not delete your account. You may need to log in again before deleting it.',
      )
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      setError('Could not log out. Please try again.')
    }
  }

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your profile, preferences, and account.</p>
        </div>

        <button
          type="button"
          className="settings-logout-button"
          onClick={handleLogout}
        >
          Log Out
        </button>
      </header>

      {message && (
        <p className="settings-message settings-message--success">
          {message}
        </p>
      )}

      {error && (
        <p className="settings-message settings-message--error">
          {error}
        </p>
      )}

      <section className="settings-card">
        <div className="settings-card-heading">
          <div>
            <h2>Profile & Personal Health Details</h2>
            <p>Keep your details accurate for a more useful experience.</p>
          </div>
        </div>

        {isLoadingProfile ? (
          <p className="settings-loading">Loading your profile...</p>
        ) : isEditingProfile ? (
          <form
            className="settings-profile-form"
            onSubmit={handleSaveProfile}
          >
            <label className="settings-field">
              First Name
              <input
                type="text"
                value={profile.firstName}
                onChange={(event) =>
                  updateProfile('firstName', event.target.value)
                }
              />
            </label>

            <label className="settings-field">
              Last Name
              <input
                type="text"
                value={profile.lastName}
                onChange={(event) =>
                  updateProfile('lastName', event.target.value)
                }
              />
            </label>

            <label className="settings-field">
              Date of Birth
              <input
                type="date"
                value={profile.dob}
                onChange={(event) =>
                  updateProfile('dob', event.target.value)
                }
              />
            </label>

            <div className="settings-field">
              <span>Gender</span>

              <div className="settings-pill-group">
                {['Male', 'Female', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={
                      profile.gender === option
                        ? 'settings-pill settings-pill--selected'
                        : 'settings-pill'
                    }
                    onClick={() =>
                      updateProfile(
                        'gender',
                        profile.gender === option ? '' : option,
                      )
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="settings-field">
              Height (cm)
              <input
                type="number"
                min="1"
                value={profile.height ?? ''}
                onChange={(event) =>
                  updateProfile('height', event.target.value)
                }
              />
            </label>

            <label className="settings-field">
              Weight (kg)
              <input
                type="number"
                min="1"
                value={profile.weight ?? ''}
                onChange={(event) =>
                  updateProfile('weight', event.target.value)
                }
              />
            </label>

            <div className="settings-field settings-field--wide">
              <span>Blood Group</span>

              <div className="settings-pill-group">
                {[
                  'A+',
                  'A-',
                  'B+',
                  'B-',
                  'AB+',
                  'AB-',
                  'O+',
                  'O-',
                  "Don't know",
                ].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={
                      profile.bloodGroup === option
                        ? 'settings-pill settings-pill--selected'
                        : 'settings-pill'
                    }
                    onClick={() =>
                      updateProfile(
                        'bloodGroup',
                        profile.bloodGroup === option ? '' : option,
                      )
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <label className="settings-field settings-field--wide">
              Known Allergies
              <input
                type="text"
                value={profile.allergies}
                placeholder="e.g. Penicillin, Peanuts"
                onChange={(event) =>
                  updateProfile('allergies', event.target.value)
                }
              />
            </label>

            <label className="settings-field">
              Primary Language
              <input
                type="text"
                value={profile.primaryLanguage}
                placeholder="e.g. English"
                onChange={(event) =>
                  updateProfile('primaryLanguage', event.target.value)
                }
              />
            </label>

            <div className="settings-section-label settings-field--wide">
              Emergency Contact <span>(optional)</span>
            </div>

            <label className="settings-field">
              Contact Name
              <input
                type="text"
                value={profile.emergencyContactName}
                onChange={(event) =>
                  updateProfile(
                    'emergencyContactName',
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="settings-field">
              Contact Phone
              <input
                type="tel"
                value={profile.emergencyContactPhone}
                onChange={(event) =>
                  updateProfile(
                    'emergencyContactPhone',
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="settings-field settings-field--wide">
              Relationship
              <input
                type="text"
                value={profile.emergencyContactRelationship}
                placeholder="e.g. Parent, spouse, sibling"
                onChange={(event) =>
                  updateProfile(
                    'emergencyContactRelationship',
                    event.target.value,
                  )
                }
              />
            </label>

            <div className="settings-section-label settings-field--wide">
              Primary Physician <span>(optional)</span>
            </div>

            <label className="settings-field">
              Physician Name
              <input
                type="text"
                value={profile.primaryPhysicianName}
                onChange={(event) =>
                  updateProfile(
                    'primaryPhysicianName',
                    event.target.value,
                  )
                }
              />
            </label>

            <label className="settings-field">
              Physician Phone
              <input
                type="tel"
                value={profile.primaryPhysicianPhone}
                onChange={(event) =>
                  updateProfile(
                    'primaryPhysicianPhone',
                    event.target.value,
                  )
                }
              />
            </label>

            <div className="settings-form-actions settings-field--wide">
              <button
                type="button"
                className="settings-secondary-button"
                onClick={handleCancelEditingProfile}
                disabled={isSaving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="settings-primary-button"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        ) : (
          <div className="settings-profile-summary">
            <div>
              <span>Name</span>
              <strong>
                {[profile.firstName, profile.lastName]
                  .filter(Boolean)
                  .join(' ') || 'Not provided'}
              </strong>
            </div>

            <div>
              <span>Date of Birth</span>
              <strong>{profile.dob || 'Not provided'}</strong>
            </div>

            <div>
              <span>Gender</span>
              <strong>{profile.gender || 'Not provided'}</strong>
            </div>

            <div>
              <span>Blood Group</span>
              <strong>{profile.bloodGroup || 'Not provided'}</strong>
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={handleStartEditingProfile}
            >
              Update your details
            </button>
          </div>
        )}
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div>
            <h2>Security</h2>
            <p>Manage your account and your stored HealthSync data.</p>
          </div>
        </div>

        <div className="settings-action-list">
          <div className="settings-action-row">
            <div>
              <h3>Change Password</h3>
              <p>Receive a password reset link by email.</p>
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={handlePasswordReset}
            >
              Send Reset Link
            </button>
          </div>

          <div className="settings-action-row">
            <div>
              <h3>Export Health Records</h3>
              <p>Download your profile, medication, and record data as JSON.</p>
            </div>

            <button
              type="button"
              className="settings-secondary-button"
              onClick={handleExport}
            >
              Export Data
            </button>
          </div>

          <div className="settings-danger-zone">
            <div>
              <h3>Delete Account & Clear Data</h3>
              <p>
                This permanently deletes your account and clears HealthSync
                data stored on this device.
              </p>
            </div>

            <button
              type="button"
              className="settings-danger-button"
              onClick={handleDeleteAccount}
            >
              Delete Account
            </button>
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div>
            <h2>Display</h2>
            <p>Choose how HealthSync should appear on this device.</p>
          </div>
        </div>

        <div className="settings-field">
          <span>Theme preference</span>

          <div className="settings-pill-group">
            {['light', 'dark', 'system'].map((option) => (
              <button
                type="button"
                key={option}
                className={
                  theme === option
                    ? 'settings-pill settings-pill--selected'
                    : 'settings-pill'
                }
                onClick={() => setTheme(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-card-heading">
          <div>
            <h2>Support & Info</h2>
            <p>Helpful information for using HealthSync.</p>
          </div>
        </div>

        <div className="settings-support-content">
          <h3>Help & FAQ</h3>

          <p>
            Use Prescription Scanner to extract text from a prescription or
            medicine package, then always verify the result before adding it.
          </p>

          <p>
            Add doctor visits, tests, vaccinations, and medications through
            Medical Records. Use the Doctors page to search by a symptom and
            find the appropriate specialty.
          </p>

          <div className="settings-support-links">
            <a href="mailto:support@healthsync.app?subject=HealthSync%20Issue">
              Report an issue
            </a>

            <a href="#">Terms of Service</a>

            <a href="#">Privacy Policy</a>
          </div>

          <p className="settings-version">HealthSync v1.0.0</p>
        </div>
      </section>

      <footer className="settings-footer">
        Founded by Anurag Kalita
      </footer>
    </div>
  )
}

export default Settings