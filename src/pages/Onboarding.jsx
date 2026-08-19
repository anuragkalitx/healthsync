import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Onboarding.css'

function getTodayDate() {
  return new Date().toLocaleDateString('en-CA')
}

function calculateAge(dateOfBirth) {
  const today = new Date()
  const birthDate = new Date(`${dateOfBirth}T00:00:00`)

  let age = today.getFullYear() - birthDate.getFullYear()

  const hasNotHadBirthdayThisYear =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())

  if (hasNotHadBirthdayThisYear) {
    age -= 1
  }

  return age
}

function Onboarding() {
  const navigate = useNavigate()
  const { saveUserProfile } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [heightUnknown, setHeightUnknown] = useState(false)
  const [weightUnknown, setWeightUnknown] = useState(false)
  const [bloodGroup, setBloodGroup] = useState('')
  const [allergies, setAllergies] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectPill = (value, setter, currentValue) => {
    setter(currentValue === value ? '' : value)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!firstName.trim() || !lastName.trim() || !dob) {
      setError(
        'Please enter your first name, last name, and date of birth.',
      )
      return
    }

    setError('')
    setIsSaving(true)

    const profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dob,
      age: calculateAge(dob),
      gender,
      height: heightUnknown || !height ? null : Number(height),
      weight: weightUnknown || !weight ? null : Number(weight),
      bloodGroup,
      allergies: allergies.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
    }

    try {
      await saveUserProfile(profileData)
      navigate('/')
    } catch (submitError) {
      console.error('Onboarding save failed:', submitError)

      setError(
        'Something went wrong saving your profile. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-card">
        <header className="onboarding-header">
          <span className="onboarding-eyebrow">Set up your profile</span>
          <h1>Welcome to HealthSync</h1>
          <p>
            Add the details you are comfortable sharing. You can update
            them later in Settings.
          </p>
        </header>

        <form className="onboarding-form" onSubmit={handleSubmit}>
          <section className="onboarding-section">
            <div className="onboarding-step-title">
              <h2>About you</h2>
              <p>These details help personalize your health companion.</p>
            </div>

            <label className="onboarding-field">
              First Name <span>*</span>

              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
              />
            </label>

            <label className="onboarding-field">
              Last Name <span>*</span>

              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
              />
            </label>

            <label className="onboarding-field">
              Date of Birth <span>*</span>

              <input
                type="date"
                value={dob}
                max={getTodayDate()}
                onChange={(event) => setDob(event.target.value)}
              />
            </label>

            <div className="onboarding-field">
              <span>Gender</span>

              <div className="onboarding-pill-group">
                {['Male', 'Female', 'Other'].map((option) => (
                  <button
                    type="button"
                    key={option}
                    className={
                      gender === option
                        ? 'onboarding-pill onboarding-pill--selected'
                        : 'onboarding-pill'
                    }
                    onClick={() =>
                      selectPill(option, setGender, gender)
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="onboarding-section">
            <div className="onboarding-step-title">
              <h2>Health details</h2>
              <p>All health details below are optional.</p>
            </div>

            <div className="onboarding-field">
              <span>Height (cm)</span>

              <div className="onboarding-quick-button-row">
                <input
                  type="number"
                  min="1"
                  value={height}
                  disabled={heightUnknown}
                  onChange={(event) => {
                    setHeightUnknown(false)
                    setHeight(event.target.value)
                  }}
                  placeholder="e.g. 170"
                />

                <button
                  type="button"
                  className="onboarding-quick-button"
                  onClick={() => {
                    if (heightUnknown) {
                      setHeightUnknown(false)
                    } else {
                      setHeight('')
                      setHeightUnknown(true)
                    }
                  }}
                >
                  {heightUnknown ? 'Enter height' : 'Not sure'}
                </button>
              </div>
            </div>

            <div className="onboarding-field">
              <span>Weight (kg)</span>

              <div className="onboarding-quick-button-row">
                <input
                  type="number"
                  min="1"
                  value={weight}
                  disabled={weightUnknown}
                  onChange={(event) => {
                    setWeightUnknown(false)
                    setWeight(event.target.value)
                  }}
                  placeholder="e.g. 65"
                />

                <button
                  type="button"
                  className="onboarding-quick-button"
                  onClick={() => {
                    if (weightUnknown) {
                      setWeightUnknown(false)
                    } else {
                      setWeight('')
                      setWeightUnknown(true)
                    }
                  }}
                >
                  {weightUnknown ? 'Enter weight' : 'Not sure'}
                </button>
              </div>
            </div>

            <div className="onboarding-field">
              <span>Blood Group</span>

              <div className="onboarding-pill-group">
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
                    type="button"
                    key={option}
                    className={
                      bloodGroup === option
                        ? 'onboarding-pill onboarding-pill--selected'
                        : 'onboarding-pill'
                    }
                    onClick={() =>
                      selectPill(
                        option,
                        setBloodGroup,
                        bloodGroup,
                      )
                    }
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-field">
              <span>Known Allergies</span>

              <div className="onboarding-quick-button-row">
                <input
                  type="text"
                  value={allergies}
                  onChange={(event) => setAllergies(event.target.value)}
                  placeholder="e.g. Penicillin, Peanuts"
                />

                <button
                  type="button"
                  className="onboarding-quick-button"
                  onClick={() => setAllergies('None known')}
                >
                  None / Not sure
                </button>
              </div>
            </div>
          </section>

          <section className="onboarding-section">
            <div className="onboarding-step-title">
              <h3>
                Emergency Contact{' '}
                <span className="onboarding-optional-label">
                  (optional)
                </span>
              </h3>
            </div>

            <label className="onboarding-field">
              Contact Name

              <input
                type="text"
                value={emergencyContactName}
                onChange={(event) =>
                  setEmergencyContactName(event.target.value)
                }
                placeholder="Contact name"
              />
            </label>

            <label className="onboarding-field">
              Contact Phone

              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(event) =>
                  setEmergencyContactPhone(event.target.value)
                }
                placeholder="Phone number"
              />
            </label>
          </section>

          {error && (
            <p className="onboarding-error" role="alert">
              {error}
            </p>
          )}

          <div className="onboarding-nav">
            <button
              type="submit"
              className="onboarding-submit-button"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default Onboarding