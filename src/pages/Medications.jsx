import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  addMedication,
  addRecord,
  getDailyStatus,
  getMedications,
  setDoseStatus,
  updateMedication,
} from '../data/healthRecords'
import './Medications.css'

const frequencies = {
  'Once daily': ['09:00'],
  'Twice daily': ['09:00', '21:00'],
  'Three times daily': ['09:00', '14:00', '21:00'],
  Custom: ['09:00'],
}

const emptyForm = {
  name: '',
  dosage: '',
  frequencyLabel: 'Once daily',
  times: ['09:00'],
  instructions: '',
  purpose: '',
  prescribingDoctor: '',
  pillCount: '',
  startDate: '',
  endDate: '',
}

function todayKey() {
  return new Date().toLocaleDateString('en-CA')
}

function formatTime(value) {
  const [hour, minute] = value.split(':').map(Number)

  return (
    String(hour % 12 || 12) +
    ':' +
    String(minute).padStart(2, '0') +
    (hour >= 12 ? ' PM' : ' AM')
  )
}

function timeGroup(value) {
  const hour = Number(value.split(':')[0])

  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  if (hour < 21) return 'Evening'

  return 'Bedtime'
}

function Medications() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, isGuest } = useAuth()

  const [medications, setMedications] = useState([])
  const [tab, setTab] = useState('active')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [dailyStatuses, setDailyStatuses] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (isGuest) {
      setIsLoading(false)
      return
    }

    if (!currentUser?.uid) {
      return
    }

    const loadMedicationData = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const [loadedMedications, loadedStatuses] =
          await Promise.all([
            getMedications(currentUser.uid),
            getDailyStatus(currentUser.uid, todayKey()),
          ])

        setMedications(loadedMedications)
        setDailyStatuses(loadedStatuses)
      } catch (error) {
        setLoadError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadMedicationData()
  }, [currentUser?.uid, isGuest])

  useEffect(() => {
    const prefillMedication = location.state?.prefillMedication

    if (prefillMedication?.name) {
      setFormData((current) => ({
        ...current,
        name: prefillMedication.name,
      }))

      setIsFormOpen(true)

      navigate(location.pathname, {
        replace: true,
        state: {},
      })
    }
  }, [location, navigate])

  const activeMedications = useMemo(
    () =>
      medications.filter(
        (medication) => medication.status === 'active',
      ),
    [medications],
  )

  const historyMedications = useMemo(
    () =>
      medications.filter(
        (medication) => medication.status === 'discontinued',
      ),
    [medications],
  )

  const todayDoses = useMemo(() => {
    const today = todayKey()

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
          medication,
          time,
          id: medication.id + '-' + time,
          group: timeGroup(time),
        })),
      )
      .sort((a, b) => a.time.localeCompare(b.time))
  }, [activeMedications])

  const groupedDoses = useMemo(() => {
    const groups = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Bedtime: [],
    }

    todayDoses.forEach((dose) => groups[dose.group].push(dose))

    return groups
  }, [todayDoses])

  const takenCount = todayDoses.filter(
    (dose) => dailyStatuses[dose.id] === 'taken',
  ).length

  const logMedicationAsRecord = async (medication) => {
    try {
      await addRecord(currentUser.uid, {
        category: 'Medication',
        subType: medication.purpose || 'Other',
        provider: medication.prescribingDoctor || 'Not specified',
        date: medication.startDate,
        notes: medication.instructions,
        followUpDate: '',
      })
    } catch {
      // Medication was still saved even if record logging fails.
    }
  }

  const updateForm = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    setFormError('')
  }

  const changeFrequency = (frequencyLabel) => {
    setFormData((current) => ({
      ...current,
      frequencyLabel,
      times: [...frequencies[frequencyLabel]],
    }))

    setFormError('')
  }

  const updateTime = (index, value) => {
    setFormData((current) => ({
      ...current,
      times: current.times.map((time, timeIndex) =>
        timeIndex === index ? value : time,
      ),
    }))
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const times = formData.times.filter(Boolean)

    if (
      !formData.name.trim() ||
      !formData.dosage.trim() ||
      times.length === 0 ||
      !formData.startDate
    ) {
      setFormError(
        'Please add a name, dosage, start date, and at least one time.',
      )
      return
    }

    if (!currentUser?.uid) {
      setFormError('Please log in before saving a medication.')
      return
    }

    const newMedication = {
      name: formData.name.trim(),
      dosage: formData.dosage.trim(),
      frequencyLabel: formData.frequencyLabel,
      times,
      timeOfDayGroups: times.map(timeGroup),
      instructions: formData.instructions.trim(),
      purpose: formData.purpose.trim(),
      prescribingDoctor: formData.prescribingDoctor.trim(),
      pillCount:
        formData.pillCount === '' ? null : Number(formData.pillCount),
      startDate: formData.startDate,
      endDate: formData.endDate,
      status: 'active',
    }

    try {
      const savedMedication = await addMedication(
        currentUser.uid,
        newMedication,
      )

      setMedications((current) => [
        ...current,
        savedMedication,
      ])

      await logMedicationAsRecord(savedMedication)

      setFormData(emptyForm)
      setFormError('')
      setIsFormOpen(false)
    } catch (error) {
      setFormError(error.message)
    }
  }

  const cycleDoseStatus = async (doseId) => {
    if (!currentUser?.uid) return

    const currentStatus = dailyStatuses[doseId]

    const nextStatus =
      currentStatus === undefined
        ? 'taken'
        : currentStatus === 'taken'
          ? 'skipped'
          : undefined

    const previousStatuses = dailyStatuses
    const nextStatuses = { ...dailyStatuses }

    if (nextStatus) {
      nextStatuses[doseId] = nextStatus
    } else {
      delete nextStatuses[doseId]
    }

    setDailyStatuses(nextStatuses)

    if (nextStatus === 'taken' && navigator.vibrate) {
      navigator.vibrate(50)
    }

    try {
      await setDoseStatus(
        currentUser.uid,
        todayKey(),
        doseId,
        nextStatus || null,
      )
    } catch (error) {
      setDailyStatuses(previousStatuses)
      console.error('Could not save dose status:', error)
    }
  }

  const refillMedication = async (medication) => {
    const response = window.prompt(
      'New pill count for ' + medication.name + ':',
      medication.pillCount ?? '',
    )

    if (response === null) return

    const nextCount = Number(response)

    if (!Number.isFinite(nextCount) || nextCount < 0) return

    const updates = { pillCount: nextCount }

    try {
      await updateMedication(
        currentUser.uid,
        medication.id,
        updates,
      )

      setMedications((current) =>
        current.map((item) =>
          item.id === medication.id
            ? { ...item, ...updates }
            : item,
        ),
      )
    } catch (error) {
      window.alert(error.message)
    }
  }

  const setMedicationStatus = async (id, status) => {
    const updates = {
      status,
      discontinuedAt:
        status === 'discontinued' ? todayKey() : null,
    }

    try {
      await updateMedication(currentUser.uid, id, updates)

      setMedications((current) =>
        current.map((medication) =>
          medication.id === id
            ? { ...medication, ...updates }
            : medication,
        ),
      )
    } catch (error) {
      window.alert(error.message)
    }
  }

  if (isGuest) {
    return (
      <div className="medications-page">
        <section className="active-medications-section">
          <div className="medications-empty-state">
            <span aria-hidden="true">💊</span>
            <h3>Medications require an account</h3>
            <p>
              Create or sign in to an account to keep your medication
              routine private and synced to your personal account.
            </p>

            <button
              className="add-medication-button"
              type="button"
              onClick={() => navigate('/login')}
            >
              Log In or Create an Account
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="medications-page">
        <section className="active-medications-section">
          <div className="medications-empty-state">
            <p>Loading your medications...</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="medications-page">
      {loadError && (
        <p className="medication-form-error" role="alert">
          {loadError}
        </p>
      )}

      <div className="medication-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'active'}
          className={
            tab === 'active'
              ? 'medication-tab medication-tab--active'
              : 'medication-tab'
          }
          onClick={() => setTab('active')}
        >
          Active
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className={
            tab === 'history'
              ? 'medication-tab medication-tab--active'
              : 'medication-tab'
          }
          onClick={() => setTab('history')}
        >
          History
        </button>
      </div>

      {tab === 'active' ? (
        <>
          <header className="medications-header">
            <div>
              <div className="medications-title-row">
                <h1>Medications</h1>

                <span className="medication-count">
                  {activeMedications.length}
                </span>
              </div>

              <p>Stay on track with your daily medication routine.</p>
            </div>

            <button
              className="add-medication-button"
              type="button"
              onClick={() => {
                setIsFormOpen((open) => !open)
                setFormError('')
              }}
            >
              {isFormOpen ? 'Close Form' : '+ Add Medication'}
            </button>
          </header>

          {isFormOpen && (
            <section className="medication-form-card">
              <h2>Add Medication</h2>

              <form className="medication-form" onSubmit={handleSave}>
                <label>
                  Name <span>*</span>

                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      updateForm('name', event.target.value)
                    }
                    placeholder="e.g. Paracetamol"
                  />
                </label>

                <label>
                  Dosage <span>*</span>

                  <input
                    type="text"
                    value={formData.dosage}
                    onChange={(event) =>
                      updateForm('dosage', event.target.value)
                    }
                    placeholder="e.g. 500 mg"
                  />
                </label>

                <label>
                  Frequency

                  <select
                    value={formData.frequencyLabel}
                    onChange={(event) =>
                      changeFrequency(event.target.value)
                    }
                  >
                    {Object.keys(frequencies).map((frequency) => (
                      <option key={frequency} value={frequency}>
                        {frequency}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="time-inputs">
                  <span>
                    Medication times <b>*</b>
                  </span>

                  {formData.times.map((time, index) => (
                    <input
                      key={index}
                      type="time"
                      value={time}
                      onChange={(event) =>
                        updateTime(index, event.target.value)
                      }
                    />
                  ))}

                  {formData.frequencyLabel === 'Custom' && (
                    <button
                      type="button"
                      className="add-time-button"
                      onClick={() =>
                        setFormData((current) => ({
                          ...current,
                          times: [...current.times, '12:00'],
                        }))
                      }
                    >
                      + Add another time
                    </button>
                  )}
                </div>

                <label>
                  Instructions tag

                  <input
                    type="text"
                    value={formData.instructions}
                    onChange={(event) =>
                      updateForm('instructions', event.target.value)
                    }
                    placeholder="e.g. Take with food"
                  />
                </label>

                <label>
                  Purpose

                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(event) =>
                      updateForm('purpose', event.target.value)
                    }
                    placeholder="e.g. Pain relief"
                  />
                </label>

                <label>
                  Prescribing doctor

                  <input
                    type="text"
                    value={formData.prescribingDoctor}
                    onChange={(event) =>
                      updateForm(
                        'prescribingDoctor',
                        event.target.value,
                      )
                    }
                    placeholder="e.g. Dr. Sarah Johnson"
                  />
                </label>

                <label>
                  Pill count / total supply

                  <input
                    type="number"
                    min="0"
                    value={formData.pillCount}
                    onChange={(event) =>
                      updateForm('pillCount', event.target.value)
                    }
                    placeholder="e.g. 30"
                  />
                </label>

                <label>
                  Start date <span>*</span>

                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(event) =>
                      updateForm('startDate', event.target.value)
                    }
                  />
                </label>

                <label>
                  End date

                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(event) =>
                      updateForm('endDate', event.target.value)
                    }
                  />
                </label>

                <div className="medication-form-footer">
                  {formError && (
                    <p className="medication-form-error">{formError}</p>
                  )}

                  <button
                    className="save-medication-button"
                    type="submit"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="routine-section">
            <div className="routine-heading">
              <div>
                <h2>Today's Routine</h2>

                <p>
                  {takenCount} of {todayDoses.length} taken today
                </p>
              </div>

              <div
                className="routine-progress"
                aria-label={
                  takenCount + ' of ' + todayDoses.length + ' taken'
                }
              >
                <span
                  style={{
                    width:
                      String(
                        todayDoses.length
                          ? (takenCount / todayDoses.length) * 100
                          : 0,
                      ) + '%',
                  }}
                />
              </div>
            </div>

            {todayDoses.length === 0 ? (
              <p className="routine-empty">
                Your doses for today will appear here.
              </p>
            ) : (
              Object.entries(groupedDoses).map(
                ([group, doses]) =>
                  doses.length > 0 && (
                    <div className="dose-group" key={group}>
                      <h3>{group}</h3>

                      {doses.map((dose) => {
                        const status = dailyStatuses[dose.id]

                        const rowClass =
                          'dose-row' +
                          (status ? ' dose-row--' + status : '')

                        const buttonClass =
                          'dose-status-button' +
                          (status
                            ? ' dose-status-button--' + status
                            : '')

                        return (
                          <div className={rowClass} key={dose.id}>
                            <div>
                              <strong>{dose.medication.name}</strong>

                              <span>
                                {dose.medication.dosage} ·{' '}
                                {formatTime(dose.time)}
                              </span>
                            </div>

                            <button
                              type="button"
                              className={buttonClass}
                              onClick={() => cycleDoseStatus(dose.id)}
                            >
                              {status === 'taken'
                                ? '✓ Taken'
                                : status === 'skipped'
                                  ? 'Skipped'
                                  : 'Tap to mark'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  ),
              )
            )}
          </section>

          <section className="active-medications-section">
            <h2>Active Medications</h2>

            {activeMedications.length === 0 ? (
              <div className="medications-empty-state">
                <span aria-hidden="true">💊</span>
                <h3>No medications yet — add your first one</h3>
              </div>
            ) : (
              <div className="medication-cards">
                {activeMedications.map((medication) => (
                  <MedicationCard
                    key={medication.id}
                    medication={medication}
                    onRefill={refillMedication}
                    onStatusChange={setMedicationStatus}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="history-section">
          <h1>Medication History</h1>

          <p>
            Medications you have discontinued are kept here for
            reference.
          </p>

          {historyMedications.length === 0 ? (
            <div className="medications-empty-state">
              <span aria-hidden="true">▤</span>
              <h3>No medication history yet</h3>
            </div>
          ) : (
            <div className="medication-cards medication-cards--history">
              {historyMedications.map((medication) => (
                <MedicationCard
                  key={medication.id}
                  medication={medication}
                  onStatusChange={setMedicationStatus}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function MedicationCard({
  medication,
  onRefill,
  onStatusChange,
}) {
  const isHistory = medication.status === 'discontinued'

  const isLowSupply =
    !isHistory &&
    medication.pillCount !== null &&
    medication.pillCount <= 5

  return (
    <article
      className={
        isHistory
          ? 'medication-card medication-card--muted'
          : 'medication-card'
      }
    >
      <div className="medication-card-top">
        <div>
          <h3>{medication.name}</h3>

          <p>
            {medication.dosage} · {medication.frequencyLabel}
          </p>
        </div>

        {isLowSupply && (
          <span className="low-supply-badge">
            Low supply — {medication.pillCount} pills left
          </span>
        )}
      </div>

      <div className="medication-meta">
        <span>
          Times: {medication.times.map(formatTime).join(', ')}
        </span>

        {medication.instructions && (
          <span className="instruction-tag">
            {medication.instructions}
          </span>
        )}

        {medication.purpose && (
          <span>Purpose: {medication.purpose}</span>
        )}

        {medication.prescribingDoctor && (
          <span>Doctor: {medication.prescribingDoctor}</span>
        )}

        {medication.pillCount !== null && (
          <span>Pills left: {medication.pillCount}</span>
        )}

        {isHistory && medication.discontinuedAt && (
          <span>Discontinued: {medication.discontinuedAt}</span>
        )}
      </div>

      <div className="medication-actions">
        {isHistory ? (
          <button
            type="button"
            className="secondary-medication-button"
            onClick={() => onStatusChange(medication.id, 'active')}
          >
            Reactivate
          </button>
        ) : (
          <>
            <button
              type="button"
              className="secondary-medication-button"
              onClick={() => onRefill(medication)}
            >
              Mark as Refilled
            </button>

            <button
              type="button"
              className="discontinue-button"
              onClick={() =>
                onStatusChange(medication.id, 'discontinued')
              }
            >
              Discontinue
            </button>
          </>
        )}
      </div>
    </article>
  )
}

export default Medications