import { useMemo, useState } from 'react'
import { doctors, symptomMap } from '../data/doctors'
import './Doctors.css'

const popularSymptoms = ['Headache', 'Fever', 'Back Pain', 'Acne', 'Anxiety', 'Joint Pain']

function initials(name) {
  return name.replace(/^Dr\.\s*/, '').split(/\s+/).slice(0, 2).map((part) => part[0]).join('')
}

function Doctors() {
  const [symptom, setSymptom] = useState('')
  const [specialty, setSpecialty] = useState('All')
  const [area, setArea] = useState('All')
  const [expandedId, setExpandedId] = useState(null)

  const specialties = useMemo(() => [...new Set(doctors.map((doctor) => doctor.specialty))].sort(), [])
  const areas = useMemo(() => [...new Set(doctors.map((doctor) => doctor.area))].sort(), [])
  const matchedSymptom = useMemo(() => {
    const value = symptom.trim().toLowerCase()
    return value ? Object.keys(symptomMap).find((key) => key.includes(value) || value.includes(key)) : null
  }, [symptom])
  const recommendedSpecialties = matchedSymptom ? symptomMap[matchedSymptom] : []
  const results = useMemo(() => doctors.filter((doctor) =>
    (specialty === 'All' || doctor.specialty === specialty) &&
    (area === 'All' || doctor.area === area) &&
    (!recommendedSpecialties.length || recommendedSpecialties.includes(doctor.specialty)),
  ), [specialty, area, recommendedSpecialties])

  const clearFilters = () => {
    setSymptom('')
    setSpecialty('All')
    setArea('All')
  }

  return (
    <div className="doctors-page">
      <header className="doctors-header">
        <h1>Find a Doctor</h1>
        <p>Search by symptom or browse doctors across Assam</p>
      </header>

      <section className="symptom-hero">
        <label className="symptom-search">
          <span aria-hidden="true">⌕</span>
          <input value={symptom} onChange={(event) => setSymptom(event.target.value)} placeholder="How are you feeling today? (e.g. headache, joint pain, anxiety)" />
        </label>
        {matchedSymptom && <div className="symptom-recommendation">💡 Symptom: '{matchedSymptom}' → Recommended: {recommendedSpecialties.join(', ')}</div>}
        <p className="disclaimer">This doesn't diagnose anything — it just helps you find the right kind of doctor. Always consult a professional for medical advice.</p>
        <div className="symptom-chips">
          {popularSymptoms.map((item) => <button key={item} type="button" onClick={() => setSymptom(item)}>{item}</button>)}
        </div>
      </section>

      <section className="doctor-filters">
        <label>Specialty<select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option>All</option>{specialties.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Area<select value={area} onChange={(event) => setArea(event.target.value)}><option>All</option>{areas.map((item) => <option key={item}>{item}</option>)}</select></label>
        <button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button>
      </section>

      <p className="results-count">{results.length} doctor{results.length === 1 ? '' : 's'} found</p>

      <section className="doctor-results">
        {results.length === 0 ? (
          <div className="doctors-empty"><h2>No doctors match your search</h2><button type="button" onClick={clearFilters}>Clear filters</button></div>
        ) : results.map((doctor) => {
          const isExpanded = expandedId === doctor.id
          return (
            <article className="doctor-row" key={doctor.id}>
              <div className="doctor-main">
                <span className="doctor-initials">{initials(doctor.name)}</span>
                <div className="doctor-name"><h2>{doctor.name}</h2><span className="specialty-pill">{doctor.specialty}</span></div>
                <p className="doctor-clinic">{doctor.clinic}</p>
                <p className="doctor-area">{doctor.area}</p>
                <button type="button" className="details-button" onClick={() => setExpandedId(isExpanded ? null : doctor.id)}>{isExpanded ? 'Hide Details' : 'View Details'}</button>
              </div>
              {isExpanded && <div className="doctor-details"><div><span>Clinic</span><strong>{doctor.clinic}</strong></div><div><span>Area</span><strong>{doctor.area}</strong></div></div>}
            </article>
          )
        })}
      </section>
    </div>
  )
}

export default Doctors
