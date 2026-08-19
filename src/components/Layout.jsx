import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDailyStatus,
  getMedications,
  getRecords,
} from '../data/healthRecords'
import './Layout.css'

const navigation = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/medical-records', label: 'Medical Records', icon: '▤' },
  {
    to: '/medications',
    label: 'Medications',
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m8.3 15.7-2-2a4.2 4.2 0 0 1 5.9-5.9l5.7 5.7a4.2 4.2 0 0 1-5.9 5.9l-2-2" />
        <path d="m9.3 10.7 4 4" />
      </svg>
    ),
  },
  { to: '/doctors', label: 'Doctors', icon: '♙' },
  { to: '/prescription-scanner', label: 'Prescription Scanner', icon: '⌗' },
]

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function getTodayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function getTomorrowKey() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return tomorrow.toLocaleDateString('en-CA')
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  const [hour, minute] = time.split(':').map(Number)
  const displayHour = hour % 12 || 12
  const suffix = hour >= 12 ? 'PM' : 'AM'

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function Layout() {
  const location = useLocation()
  const { currentUser, userProfile, isGuest } = useAuth()
  const notificationRef = useRef(null)

  const [records, setRecords] = useState([])
  const [medications, setMedications] = useState([])
  const [dailyStatuses, setDailyStatuses] = useState({})
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const today = getTodayKey()
  const tomorrow = getTomorrowKey()
  const isDashboard = location.pathname === '/'
  const greetingName =
    userProfile?.firstName || (isGuest ? 'there' : 'there')

  useEffect(() => {
    if (isGuest) {
      setRecords([])
      setMedications([])
      setDailyStatuses({})
      return
    }

    if (!currentUser?.uid) {
      return
    }

    const loadNotificationData = async () => {
      try {
        const [
          loadedRecords,
          loadedMedications,
          loadedDailyStatuses,
        ] = await Promise.all([
          getRecords(currentUser.uid),
          getMedications(currentUser.uid),
          getDailyStatus(currentUser.uid, today),
        ])

        setRecords(loadedRecords)
        setMedications(loadedMedications)
        setDailyStatuses(loadedDailyStatuses)
      } catch (error) {
        console.error('Could not load notification data:', error)
      }
    }

    loadNotificationData()
  }, [currentUser?.uid, isGuest, today])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [])

  const dueMedications = useMemo(() => {
    return medications
      .filter((medication) => medication.status === 'active')
      .filter(
        (medication) =>
          !medication.startDate || medication.startDate <= today,
      )
      .filter(
        (medication) =>
          !medication.endDate || medication.endDate >= today,
      )
      .flatMap((medication) =>
        (medication.times || []).map((time) => ({
          id: `${medication.id}-${time}`,
          name: medication.name,
          time,
        })),
      )
      .filter((dose) => dailyStatuses[dose.id] !== 'taken')
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [dailyStatuses, medications, today])

  const upcomingAppointments = useMemo(() => {
    return records
      .filter(
        (record) =>
          record.followUpDate &&
          record.followUpDate >= today &&
          record.followUpDate <= tomorrow,
      )
      .sort(
        (a, b) =>
          new Date(a.followUpDate) - new Date(b.followUpDate),
      )
  }, [records, today, tomorrow])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">HealthSync</div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map(({ to, label, icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
            >
              <span aria-hidden="true" className="nav-icon">
                {typeof icon === 'string' ? icon : icon}
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `nav-link sidebar-settings${isActive ? ' nav-link--active' : ''}`
          }
        >
          <span aria-hidden="true" className="nav-icon">
            ⚙
          </span>
          Settings
        </NavLink>
      </aside>

      <main className="main-content">
        {isDashboard && (
          <header className="top-bar">
            <div>
              <h1>
                {getGreeting()}, {greetingName}{' '}
                <span role="img" aria-label="wave">
                  👋
                </span>
              </h1>
              <p>Here’s your health overview.</p>
            </div>

            <div className="top-bar-actions">
              <div
                className="notification-menu"
                ref={notificationRef}
              >
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={isNotificationsOpen}
                  onClick={() =>
                    setIsNotificationsOpen((isOpen) => !isOpen)
                  }
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                    <path d="M10 21h4" />
                  </svg>
                </button>

                {isNotificationsOpen && (
                  <div
                    className="notification-dropdown"
                    role="status"
                  >
                    {dueMedications.length === 0 &&
                    upcomingAppointments.length === 0 ? (
                      <p className="notification-empty">
                        You’re all caught up
                      </p>
                    ) : (
                      <>
                        {dueMedications.length > 0 && (
                          <section className="notification-section">
                            <h2>Medications due</h2>

                            <div className="notification-list">
                              {dueMedications.map((dose) => (
                                <p key={dose.id}>
                                  {dose.name || 'Unnamed medication'} ·{' '}
                                  {formatTime(dose.time)}
                                </p>
                              ))}
                            </div>
                          </section>
                        )}

                        {upcomingAppointments.length > 0 && (
                          <section className="notification-section">
                            <h2>Appointments coming up</h2>

                            <div className="notification-list">
                              {upcomingAppointments.map((record) => (
                                <p key={record.id}>
                                  {record.provider ||
                                    record.subType ||
                                    'Appointment'}{' '}
                                  · {formatDate(record.followUpDate)}
                                </p>
                              ))}
                            </div>
                          </section>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        <section className="page-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}

export default Layout