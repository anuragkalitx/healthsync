import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase'

function requireUid(uid) {
  if (!uid) {
    throw new Error('You must be logged in to access health records.')
  }
}

export async function getRecords(uid) {
  try {
    requireUid(uid)

    const recordsQuery = query(
      collection(db, 'users', uid, 'records'),
      orderBy('date', 'desc'),
    )

    const snapshot = await getDocs(recordsQuery)

    return snapshot.docs.map((recordDocument) => ({
      id: recordDocument.id,
      ...recordDocument.data(),
    }))
  } catch (error) {
    throw new Error(
      'Could not load your medical records. Please try again.',
    )
  }
}

export async function addRecord(uid, recordData) {
  try {
    requireUid(uid)

    const recordReference = await addDoc(
      collection(db, 'users', uid, 'records'),
      {
        category: recordData.category || '',
        subType: recordData.subType || '',
        provider: recordData.provider || '',
        date: recordData.date || '',
        notes: recordData.notes || '',
        followUpDate: recordData.followUpDate || '',
      },
    )

    return {
      id: recordReference.id,
      ...recordData,
    }
  } catch (error) {
    throw new Error(
      'Could not add your medical record. Please try again.',
    )
  }
}

export async function updateRecord(uid, recordId, updates) {
  try {
    requireUid(uid)

    await updateDoc(
      doc(db, 'users', uid, 'records', recordId),
      updates,
    )
  } catch (error) {
    throw new Error(
      'Could not update this medical record. Please try again.',
    )
  }
}

export async function deleteRecord(uid, recordId) {
  try {
    requireUid(uid)

    await deleteDoc(doc(db, 'users', uid, 'records', recordId))
  } catch (error) {
    throw new Error(
      'Could not delete this medical record. Please try again.',
    )
  }
}

export async function getMedications(uid) {
  try {
    requireUid(uid)

    const snapshot = await getDocs(
      collection(db, 'users', uid, 'medications'),
    )

    return snapshot.docs.map((medicationDocument) => ({
      id: medicationDocument.id,
      ...medicationDocument.data(),
    }))
  } catch (error) {
    throw new Error(
      'Could not load your medications. Please try again.',
    )
  }
}

export async function addMedication(uid, medicationData) {
  try {
    requireUid(uid)

    const medicationReference = await addDoc(
      collection(db, 'users', uid, 'medications'),
      {
        name: medicationData.name || '',
        dosage: medicationData.dosage || '',
        frequencyLabel: medicationData.frequencyLabel || '',
        times: medicationData.times || [],
        instructions: medicationData.instructions || '',
        purpose: medicationData.purpose || '',
        prescribingDoctor: medicationData.prescribingDoctor || '',
        pillCount: medicationData.pillCount ?? null,
        startDate: medicationData.startDate || '',
        endDate: medicationData.endDate || '',
        status: medicationData.status || 'active',
        discontinuedAt: medicationData.discontinuedAt || null,
      },
    )

    return {
      id: medicationReference.id,
      ...medicationData,
    }
  } catch (error) {
    throw new Error(
      'Could not add your medication. Please try again.',
    )
  }
}

export async function updateMedication(uid, medicationId, updates) {
  try {
    requireUid(uid)

    await updateDoc(
      doc(db, 'users', uid, 'medications', medicationId),
      updates,
    )
  } catch (error) {
    throw new Error(
      'Could not update this medication. Please try again.',
    )
  }
}

export async function deleteMedication(uid, medicationId) {
  try {
    requireUid(uid)

    await deleteDoc(
      doc(db, 'users', uid, 'medications', medicationId),
    )
  } catch (error) {
    throw new Error(
      'Could not delete this medication. Please try again.',
    )
  }
}

export async function getDailyStatus(uid, dateKey) {
  try {
    requireUid(uid)

    const statusSnapshot = await getDoc(
      doc(db, 'users', uid, 'dailyStatus', dateKey),
    )

    if (!statusSnapshot.exists()) {
      return {}
    }

    return statusSnapshot.data().statuses || {}
  } catch (error) {
    throw new Error(
      'Could not load today’s medication statuses. Please try again.',
    )
  }
}

export async function setDoseStatus(uid, dateKey, doseId, status) {
  try {
    requireUid(uid)

    const dailyStatusReference = doc(
      db,
      'users',
      uid,
      'dailyStatus',
      dateKey,
    )

    const dailyStatusSnapshot = await getDoc(dailyStatusReference)

    const correctedStatuses = dailyStatusSnapshot.exists()
      ? { ...(dailyStatusSnapshot.data().statuses || {}) }
      : {}

    if (status === null) {
      delete correctedStatuses[doseId]
    } else {
      correctedStatuses[doseId] = status
    }

    await setDoc(
      dailyStatusReference,
      { statuses: correctedStatuses },
      { merge: true },
    )
  } catch (error) {
    throw new Error(
      'Could not save this medication status. Please try again.',
    )
  }
}