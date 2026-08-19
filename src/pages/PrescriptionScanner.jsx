import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorker } from 'tesseract.js'
import { findMedicineReference } from '../data/medicineReference'
import './PrescriptionScanner.css'

function guessMedicineName(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const scoredLines = lines.map((line, index) => {
    const cleanedLine = line.replace(/[^A-Za-z0-9\s.-]/g, '').trim()
    const hasDose = /\b\d+\s?(mg|mcg|ml|g|iu)\b/i.test(line)
    const hasLetters = /[A-Za-z]{2,}/.test(cleanedLine)

    const reasonableLength =
      cleanedLine.length >= 2 && cleanedLine.length <= 25

    let score = 0

    if (hasDose) score += 8
    if (hasLetters) score += 4
    if (reasonableLength) score += 4

    score += Math.max(0, 5 - index)

    if (cleanedLine.split(/\s+/).length > 5) score -= 5
    if (cleanedLine.length > 35) score -= 5

    return {
      line: cleanedLine,
      score,
    }
  })

  const bestMatch = scoredLines
    .filter((item) => item.line)
    .sort((a, b) => b.score - a.score)[0]

  if (!bestMatch) return ''

  return bestMatch.line
    .replace(/\b\d+\s?(mg|mcg|ml|g|iu)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function PrescriptionScanner() {
  const navigate = useNavigate()

  const [isReading, setIsReading] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [medicineName, setMedicineName] = useState('')
  const [error, setError] = useState('')

  const handleImageUpload = async (event) => {
    const image = event.target.files?.[0]

    if (!image) return

    setIsReading(true)
    setExtractedText('')
    setMedicineName('')
    setError('')

    try {
      const worker = await createWorker('eng')
      const result = await worker.recognize(image)

      await worker.terminate()

      const text = result.data.text

      setExtractedText(text)
      setMedicineName(guessMedicineName(text))
    } catch {
      setError('Could not read this image, try a clearer photo')
    } finally {
      setIsReading(false)
    }
  }

  const handleAddToMedications = () => {
    const trimmedName = medicineName.trim()

    if (!trimmedName) return

    navigate('/medications', {
      state: {
        prefillMedication: {
          name: trimmedName,
        },
      },
    })
  }

  const medicineReference = findMedicineReference(medicineName)

  return (
    <div className="scanner-page">
      <header className="scanner-header">
        <span className="scanner-eyebrow">Smart scan</span>

        <div className="scanner-title-row">
          <h1>Prescription Scanner</h1>
          <span className="beta-tag">Beta</span>
        </div>

        <p>
          Upload a prescription or medicine package and review the
          extracted details carefully.
        </p>
      </header>

      <section className="scanner-card">
        <label className="scanner-dropzone">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageUpload}
          />

          <span className="scanner-upload-icon" aria-hidden="true">
            ▣
          </span>

          <span className="scanner-dropzone-title">
            Upload or photograph your prescription
          </span>

          <span className="scanner-dropzone-description">
            Choose a clear, well-lit image. You can use your phone
            camera or select an existing image.
          </span>

          <span className="scanner-upload-button">
            Choose image
          </span>
        </label>

        {isReading && (
          <div className="scanner-loading">
            <span className="scanner-spinner" aria-hidden="true" />
            <span>Reading your image...</span>
          </div>
        )}

        {error && (
          <div className="scanner-error">
            <span aria-hidden="true">!</span>
            {error}
          </div>
        )}
      </section>

      {extractedText && (
        <section className="scanner-results">
          <article className="extracted-text-card">
            <div className="result-card-heading">
              <div>
                <span className="result-card-eyebrow">
                  OCR result
                </span>
                <h2>Extracted Text</h2>
              </div>

              <span className="result-card-icon" aria-hidden="true">
                ▤
              </span>
            </div>

            <pre>{extractedText}</pre>
          </article>

          <article className="medicine-result-card">
            <span className="result-card-eyebrow">
              Review result
            </span>

            <h2>Medicine name</h2>

            <label className="medicine-name-field">
              <span>Check and correct the detected name</span>

              <input
                type="text"
                value={medicineName}
                onChange={(event) =>
                  setMedicineName(event.target.value)
                }
                placeholder="Enter medicine name"
              />
            </label>

            {medicineReference && (
              <div className="medicine-reference-box">
                <strong>
                  General reference — not medical advice.
                </strong>

                <p>{medicineReference}</p>

                <small>
                  Always confirm with a pharmacist or doctor.
                </small>
              </div>
            )}

            <button
              type="button"
              className="scanner-add-to-medications-button"
              onClick={handleAddToMedications}
              disabled={!medicineName.trim()}
            >
              Add to Medications →
            </button>
          </article>
        </section>
      )}
    </div>
  )
}

export default PrescriptionScanner