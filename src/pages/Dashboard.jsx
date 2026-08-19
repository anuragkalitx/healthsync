import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getDailyStatus,
  getMedications,
  getRecords,
} from '../data/healthRecords'
import './Dashboard.css'

const categoryIcons = {
  'Doctor Visit': '🩺',
  'Lab & Diagnostic': '⚗',
  Vaccination: '💉',
  Medication: '💊',
}

function getTodayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

function formatTime(time) {
  const [hour, minute] = time.split(':').map(Number)
  const displayHour = hour % 12 || 12
  const suffix = hour >= 12 ? 'PM' : 'AM'

  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`
}

function Dashboard() {
  const navigate = useNavigate()
  const { currentUser, isGuest } = useAuth()

  const [records, setRecords] = useState([])
  const [medications, setMedications] = useState([])
  const [dailyStatuses, setDailyStatuses] = useState({})
  const [dailyCheckIn, setDailyCheckIn] = useState('')
  const [sadFollowUp, setSadFollowUp] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const today = getTodayKey()

  useEffect(() => {
    if (isGuest) {
      setIsLoading(false)
      return
    }

    if (!currentUser?.uid) {
      return
    }

    const loadDashboardData = async () => {
      setIsLoading(true)

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
        console.error('Could not load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [currentUser?.uid, isGuest, today])

  const activeMedications = useMemo(
    () =>
      medications.filter(
        (medication) => medication.status === 'active',
      ),
    [medications],
  )

  const scheduledDoses = useMemo(() => {
    return activeMedications
      .filter(
        (medication) =>
          !medication.startDate || medication.startDate <= today,
      )
      .filter(
        (medication) =>
          !medication.endDate || medication.endDate >= today,
      )
      .flatMap((medication) =>
        medication.times.map((time) => ({
          id: `${medication.id}-${time}`,
          medication,
          time,
        })),
      )
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [activeMedications, today])

  const upcomingAppointments = useMemo(() => {
    return records
      .filter(
        (record) =>
          record.followUpDate && record.followUpDate >= today,
      )
      .sort(
        (a, b) =>
          new Date(a.followUpDate) - new Date(b.followUpDate),
      )
  }, [records, today])

  const nextAppointment = upcomingAppointments[0]

  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3)
  }, [records])

  const takenCount = scheduledDoses.filter(
    (dose) => dailyStatuses[dose.id] === 'taken',
  ).length

  const adherence =
    scheduledDoses.length > 0
      ? Math.round((takenCount / scheduledDoses.length) * 100)
      : null

  const dashboardStats = [
    {
      label: 'Medical Records',
      value: String(records.length),
      detail: records.length === 1 ? 'Total record' : 'Total records',
      icon: '▤',
    },
    {
      label: 'Active Medications',
      value: String(activeMedications.length),
      detail: 'Currently tracking',
      icon: '💊',
    },
    {
      label: 'Upcoming Appointments',
      value: String(upcomingAppointments.length),
      detail: nextAppointment
        ? `Next: ${formatShortDate(nextAppointment.followUpDate)}`
        : 'No upcoming',
      icon: '▣',
    },
    {
      label: 'Medication Adherence',
      value: adherence === null ? '—' : `${adherence}%`,
      detail: 'Today',
      icon: '♥',
    },
  ]

  return (
    <div className="dashboard">
      {isLoading ? (
        <p className="dashboard-empty-message">
          Loading your dashboard...
        </p>
      ) : (
        <>
          <section className="stats-grid" aria-label="Health summary">
            {dashboardStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span className="stat-icon" aria-hidden="true">
                  {stat.icon}
                </span>

                <div>
                  <p className="stat-label">{stat.label}</p>
                  <p className="stat-value">{stat.value}</p>
                  <p className="stat-detail">{stat.detail}</p>
                </div>
              </article>
            ))}
          </section>

          <section className="dashboard-columns">
            <div className="dashboard-column dashboard-column--wide">
              <article className="dashboard-card">
                <h2>Today's Medications</h2>

                {scheduledDoses.length === 0 ? (
                  <p className="dashboard-empty-message">
                    No medications scheduled for today
                  </p>
                ) : (
                  <div className="table-wrapper">
                    <table className="medications-table">
                      <thead>
                        <tr>
                          <th>Medicine</th>
                          <th>Dose</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {scheduledDoses.map((dose) => {
                          const status =
                            dailyStatuses[dose.id] || 'Upcoming'

                          return (
                            <tr key={dose.id}>
                              <td>{dose.medication.name}</td>
                              <td>{dose.medication.dosage}</td>
                              <td>{formatTime(dose.time)}</td>
                              <td>
                                <span
                                  className={`status-badge status-badge--${status.toLowerCase()}`}
                                >
                                  {status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              <article className="dashboard-card">
                <h2>Recent Medical Records</h2>

                {recentRecords.length === 0 ? (
                  <div className="records-empty-inline">
                    <p>No records yet — add your first visit</p>

                    <button
                      type="button"
                      onClick={() => navigate('/medical-records')}
                    >
                      Add a record
                    </button>
                  </div>
                ) : (
                  <div className="records-list">
                    {recentRecords.map((record) => (
                      <button
                        className="record-row"
                        key={record.id}
                        type="button"
                        onClick={() => navigate('/medical-records')}
                      >
                        <span className="record-icon" aria-hidden="true">
                          {categoryIcons[record.category] || '▤'}
                        </span>

                        <span className="record-summary">
                          <strong>{record.subType}</strong>
                          <span>
                            {record.provider || 'Not specified'}
                          </span>
                        </span>

                        <span className="record-summary">
                          <span className="record-date">
                            {formatDate(record.date)}
                          </span>
                          <span>{record.notes || 'No notes added'}</span>
                        </span>

                        <span className="record-arrow" aria-hidden="true">
                          ›
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            </div>

            <div className="dashboard-column">
              <article className="dashboard-card appointment-card">
                <h2>Next Appointment</h2>

                {nextAppointment ? (
                  <>
                    <div className="appointment-doctor">
                      <span className="doctor-avatar" aria-hidden="true">
                        {nextAppointment.provider
                          ? nextAppointment.provider
                              .replace(/^Dr\.\s*/i, '')
                              .split(' ')
                              .slice(0, 2)
                              .map((part) => part[0])
                              .join('')
                          : 'DR'}
                      </span>

                      <div>
                        <h3>
                          {nextAppointment.provider || 'Not specified'}
                        </h3>
                        <p>{nextAppointment.subType}</p>
                      </div>
                    </div>

                    <dl className="appointment-details">
                      <div>
                        <dt>Date</dt>
                        <dd>
                          {formatDate(nextAppointment.followUpDate)}
                        </dd>
                      </div>

                      <div>
                        <dt>Reason</dt>
                        <dd>
                          {nextAppointment.notes ||
                            'No reason added'}
                        </dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <div className="appointment-empty-state">
                    <span aria-hidden="true">▣</span>
                    <h3>No upcoming appointments</h3>
                    <p>
                      Add a follow-up date when logging a medical record
                      to see it here.
                    </p>
                  </div>
                )}
              </article>

              <article className="dashboard-card check-in-card">
                <h2>How are you feeling today?</h2>

                {sadFollowUp === 'prompt' ? (
                  <div className="check-in-follow-up">
                    <p>
                      Sorry to hear that. Want me to point you toward a
                      doctor?
                    </p>

                    <div className="check-in-options check-in-options--follow-up">
                      <button
                        type="button"
                        className="check-in-option check-in-follow-up-button"
                        onClick={() => navigate('/doctors')}
                      >
                        Yes, take me there
                      </button>

                      <button
                        type="button"
                        className="check-in-option check-in-follow-up-button"
                        onClick={() => setSadFollowUp('declined')}
                      >
                        No, I&apos;m okay
                      </button>
                    </div>
                  </div>
                ) : sadFollowUp === 'declined' ? (
                  <p className="check-in-confirmation">
                    Okay, take care of yourself. Hope you feel better soon
                    💙
                  </p>
                ) : (
                  <>
                    <div className="check-in-options">
                      {[
                        { label: 'Good', emoji: '🙂' },
                        { label: 'Okay', emoji: '😐' },
                        { label: 'Not great', emoji: '🙁' },
                      ].map((option) => (
                        <button
                          type="button"
                          key={option.label}
                          className={`check-in-option${
                            dailyCheckIn === option.label
                              ? ' check-in-option--selected'
                              : ''
                          }`}
                          onClick={() => {
                            setDailyCheckIn(option.label)

                            if (option.label === 'Not great') {
                              setSadFollowUp('prompt')
                            } else {
                              setSadFollowUp(null)
                            }
                          }}
                        >
                          <span aria-hidden="true">{option.emoji}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {dailyCheckIn === 'Good' && (
                      <p className="check-in-confirmation">
                        Heyyy, happy for you too! Keep that energy going
                        🎉
                      </p>
                    )}

                    {dailyCheckIn === 'Okay' && (
                      <p className="check-in-confirmation">
                        Ahh, cheer up — it&apos;s life after all. Better
                        days are ahead 💫
                      </p>
                    )}
                  </>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default Dashboard