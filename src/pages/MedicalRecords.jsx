import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addRecord, getRecords } from '../data/healthRecords'
import './MedicalRecords.css'

const categoryOptions = {
  'Doctor Visit': {
    fieldLabel: 'Specialist Type',
    options: [
      'General Physician', 'Cardiologist', 'Dermatologist', 'Neurologist',
      'Orthopedic', 'ENT', 'Dentist', 'Gynecologist', 'Pediatrician',
      'Psychiatrist', 'Ophthalmologist', 'Other',
    ],
  },
  'Lab & Diagnostic': {
    fieldLabel: 'Test/Scan Type',
    options: [
      'X-Ray', 'Ultrasound', 'MRI', 'CT Scan', 'Blood Test (CBC)',
      'Blood Sugar Test', 'Lipid Profile', 'ECG', 'Urine Test',
      'Endoscopy', 'Other',
    ],
  },
  Vaccination: {
    fieldLabel: 'Vaccine Type',
    options: [
      'Flu Shot', 'COVID-19', 'Tetanus', 'Hepatitis B', 'MMR',
      'Polio', 'Rabies', 'HPV', 'Typhoid', 'Chickenpox', 'Other',
    ],
  },
  Medication: {
    fieldLabel: 'Medication Purpose',
    options: [
      'Pain Relief', 'Antibiotic', 'Allergy', 'Blood Pressure',
      'Diabetes', 'Vitamin/Supplement', 'Digestive', 'Other',
    ],
  },
}

const categoryIcons = {
  'Doctor Visit': '🩺',
  'Lab & Diagnostic': '⚗',
  Vaccination: '💉',
  Medication: '💊',
}

const emptyForm = {
  category: '',
  subType: '',
  customSubType: '',
  provider: '',
  date: '',
  notes: '',
  followUpDate: '',
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

function MedicalRecords() {
  const navigate = useNavigate()
  const { currentUser, isGuest } = useAuth()

  const [records, setRecords] = useState([])
  const [activeFilter, setActiveFilter] = useState('All Records')
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [expandedRecordId, setExpandedRecordId] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!currentUser?.uid) {
      if (isGuest) {
        setIsLoading(false)
      }

      return
    }

    const loadRecords = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const loadedRecords = await getRecords(currentUser.uid)
        setRecords(loadedRecords)
      } catch (error) {
        setLoadError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadRecords()
  }, [currentUser?.uid, isGuest])

  const visibleRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return records
      .filter(
        (record) =>
          activeFilter === 'All Records' ||
          record.category === activeFilter,
      )
      .filter(
        (record) =>
          !query ||
          [record.provider, record.subType].some((value) =>
            value?.toLowerCase().includes(query),
          ),
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [records, activeFilter, searchTerm])

  const groupedRecords = useMemo(() => {
    return visibleRecords.reduce((groups, record) => {
      const dateLabel = formatDate(record.date)

      groups[dateLabel] = groups[dateLabel]
        ? [...groups[dateLabel], record]
        : [record]

      return groups
    }, {})
  }, [visibleRecords])

  const updateForm = (field, value) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    setFormError('')
  }

  const handleCategoryChange = (category) => {
    setFormData((current) => ({
      ...current,
      category,
      subType: '',
      customSubType: '',
    }))

    setFormError('')
  }

  const handleSave = async (event) => {
    event.preventDefault()

    const subType =
      formData.subType === 'Other'
        ? formData.customSubType.trim()
        : formData.subType

    if (!formData.category || !subType || !formData.date) {
      setFormError(
        'Please complete category, type, and date before saving.',
      )
      return
    }

    if (!currentUser?.uid) {
      setFormError('Please log in before saving a medical record.')
      return
    }

    try {
      const newRecord = await addRecord(currentUser.uid, {
        category: formData.category,
        subType,
        provider: formData.provider.trim() || 'Not specified',
        date: formData.date,
        notes: formData.notes.trim(),
        followUpDate: formData.followUpDate,
      })

      setRecords((current) => [...current, newRecord])
      setFormData(emptyForm)
      setFormError('')
      setIsFormOpen(false)
    } catch (error) {
      setFormError(error.message)
    }
  }

  const selectedCategory = categoryOptions[formData.category]

  if (isGuest) {
    return (
      <div className="records-page">
        <section className="records-list">
          <div className="records-empty-state">
            <span aria-hidden="true">▤</span>
            <h2>Medical records require an account</h2>
            <p>
              Create or sign in to an account to keep your health data
              private and synced to your personal account.
            </p>

            <button
              className="add-record-button"
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

  return (
    <div className="records-page">
      <header className="records-header">
        <div>
          <div className="records-title-row">
            <h1>Medical Records</h1>
            <span className="record-count">{records.length}</span>
          </div>

          <p>Keep your health history organized in one place.</p>
        </div>

        <button
          className="add-record-button"
          type="button"
          onClick={() => {
            setIsFormOpen((open) => !open)
            setFormError('')
          }}
        >
          {isFormOpen ? 'Close Form' : '+ Add New Record'}
        </button>
      </header>

      {loadError && (
        <p className="form-error" role="alert">
          {loadError}
        </p>
      )}

      {isFormOpen && (
        <section className="record-form-card">
          <h2>Add Medical Record</h2>

          <form className="record-form" onSubmit={handleSave}>
            <label>
              Category <span>*</span>

              <select
                value={formData.category}
                onChange={(event) =>
                  handleCategoryChange(event.target.value)
                }
              >
                <option value="">Select category</option>

                {Object.keys(categoryOptions).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            {selectedCategory && (
              <label>
                {selectedCategory.fieldLabel} <span>*</span>

                <select
                  value={formData.subType}
                  onChange={(event) =>
                    updateForm('subType', event.target.value)
                  }
                >
                  <option value="">Select type</option>

                  {selectedCategory.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {formData.subType === 'Other' && (
              <label>
                Enter custom type <span>*</span>

                <input
                  type="text"
                  value={formData.customSubType}
                  onChange={(event) =>
                    updateForm('customSubType', event.target.value)
                  }
                  placeholder="Enter type"
                />
              </label>
            )}

            <label>
              Doctor/provider name

              <input
                type="text"
                value={formData.provider}
                onChange={(event) =>
                  updateForm('provider', event.target.value)
                }
                placeholder="e.g. Dr. Sarah Johnson"
              />
            </label>

            <label>
              Date of visit <span>*</span>

              <input
                type="date"
                value={formData.date}
                onChange={(event) =>
                  updateForm('date', event.target.value)
                }
              />
            </label>

            <label>
              Follow-up date

              <input
                type="date"
                value={formData.followUpDate}
                onChange={(event) =>
                  updateForm('followUpDate', event.target.value)
                }
              />
            </label>

            <label className="form-field--wide">
              Notes

              <textarea
                rows="4"
                value={formData.notes}
                onChange={(event) =>
                  updateForm('notes', event.target.value)
                }
                placeholder="Add any details you want to remember"
              />
            </label>

            <div className="form-footer form-field--wide">
              {formError && <p className="form-error">{formError}</p>}

              <button className="save-record-button" type="submit">
                Save Record
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="records-toolbar">
        <div className="filter-tabs" aria-label="Record categories">
          {['All Records', ...Object.keys(categoryOptions)].map(
            (tab) => (
              <button
                type="button"
                key={tab}
                className={`filter-tab${
                  activeFilter === tab ? ' filter-tab--active' : ''
                }`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ),
          )}
        </div>

        <label className="records-search">
          <span aria-hidden="true">⌕</span>

          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search records"
            aria-label="Search by doctor or record type"
          />
        </label>
      </section>

      <section className="records-list">
        {isLoading ? (
          <div className="records-empty-state">
            <p>Loading your records...</p>
          </div>
        ) : visibleRecords.length === 0 ? (
          <div className="records-empty-state">
            <span aria-hidden="true">▤</span>
            <h2>No records yet — add your first visit</h2>
            <p>
              Your appointments, tests, vaccinations, and medications
              will appear here.
            </p>
          </div>
        ) : (
          Object.entries(groupedRecords).map(([date, dateRecords]) => (
            <div className="record-date-group" key={date}>
              <h2>{date}</h2>

              {dateRecords.map((record) => {
                const isExpanded = expandedRecordId === record.id

                return (
                  <article className="medical-record-card" key={record.id}>
                    <button
                      className="medical-record-summary"
                      type="button"
                      onClick={() =>
                        setExpandedRecordId(
                          isExpanded ? null : record.id,
                        )
                      }
                      aria-expanded={isExpanded}
                    >
                      <span
                        className="medical-record-icon"
                        aria-hidden="true"
                      >
                        {categoryIcons[record.category]}
                      </span>

                      <span className="medical-record-main">
                        <strong>{record.subType}</strong>
                        <span>{record.provider}</span>
                      </span>

                      <span className="medical-record-preview">
                        {record.notes || 'No notes added'}
                      </span>

                      <span
                        className="record-expand-icon"
                        aria-hidden="true"
                      >
                        {isExpanded ? '⌃' : '⌄'}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="medical-record-details">
                        <div>
                          <span>Category</span>
                          <strong>{record.category}</strong>
                        </div>

                        <div>
                          <span>Date</span>
                          <strong>{formatDate(record.date)}</strong>
                        </div>

                        <div className="medical-record-notes">
                          <span>Notes</span>
                          <p>
                            {record.notes ||
                              'No notes were added for this record.'}
                          </p>
                        </div>

                        {record.followUpDate && (
                          <div>
                            <span>Follow-up date</span>
                            <strong>
                              {formatDate(record.followUpDate)}
                            </strong>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ))
        )}
      </section>
    </div>
  )
}

export default MedicalRecords