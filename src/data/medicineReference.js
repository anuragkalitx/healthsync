const medicineReference = {
  paracetamol: 'Commonly used for pain relief and reducing fever.',
  'dolo 650': 'Brand name for Paracetamol — commonly used for pain relief and reducing fever.',
  crocin: 'Brand name for Paracetamol — commonly used for pain relief and reducing fever.',
  calpol: 'Brand name for Paracetamol — commonly used for pain relief and reducing fever.',
  pyremust: 'Brand name for Paracetamol — commonly used for pain relief and reducing fever.',
  ibuprofen: 'Commonly used for pain relief and reducing inflammation.',
  brufen: 'Brand name for Ibuprofen — commonly used for pain relief and reducing inflammation.',
  combiflam: 'Contains Ibuprofen and Paracetamol — commonly used for pain relief and fever.',
  amoxicillin: 'An antibiotic commonly used to treat bacterial infections.',
  augmentin: 'Brand name containing Amoxicillin — an antibiotic used to treat bacterial infections.',
  azithromycin: 'An antibiotic commonly used to treat bacterial infections.',
  azithral: 'Brand name for Azithromycin — an antibiotic used to treat bacterial infections.',
  cetirizine: 'Commonly used to relieve allergy symptoms.',
  cetrizine: 'Commonly used to relieve allergy symptoms.',
  zyrtec: 'Brand name for Cetirizine — used to relieve allergy symptoms.',
  omeprazole: 'Commonly used to reduce stomach acid and treat acid reflux.',
  omez: 'Brand name for Omeprazole — used to reduce stomach acid and treat acid reflux.',
  pantoprazole: 'Commonly used to reduce stomach acid and treat acid reflux.',
  pantocid: 'Brand name for Pantoprazole — used to reduce stomach acid and treat acid reflux.',
  metformin: 'Commonly used to manage blood sugar levels in type 2 diabetes.',
  glycomet: 'Brand name for Metformin — used to manage blood sugar in type 2 diabetes.',
  amlodipine: 'Commonly used to manage high blood pressure.',
  amlopres: 'Brand name for Amlodipine — used to manage high blood pressure.',
  losartan: 'Commonly used to manage high blood pressure.',
  atorvastatin: 'Commonly used to manage cholesterol levels.',
  atorva: 'Brand name for Atorvastatin — used to manage cholesterol levels.',
  aspirin: 'Commonly used for pain relief and as a blood thinner.',
  disprin: 'Brand name for Aspirin — used for pain relief and as a blood thinner.',
  ecosprin: 'Brand name for Aspirin — commonly used as a blood thinner.',
  domperidone: 'Commonly used to relieve nausea and vomiting.',
  domstal: 'Brand name for Domperidone — used to relieve nausea and vomiting.',
  'vitamin d3': 'A supplement commonly used to support bone health.',
  'd-rise': 'Brand name for Vitamin D3 — supports bone health.',
  multivitamin: 'A supplement used to support general nutritional needs.',
  revital: 'A multivitamin supplement used to support general nutritional needs.',
  salbutamol: 'Commonly used to relieve asthma and breathing difficulty.',
  asthalin: 'Brand name for Salbutamol — used to relieve asthma and breathing difficulty.',
  diclofenac: 'Commonly used for pain relief and reducing inflammation.',
  voveran: 'Brand name for Diclofenac — used for pain relief and reducing inflammation.',
  ors: 'Oral Rehydration Salts — commonly used to prevent or treat dehydration.',
  electral: 'Brand name for ORS — used to prevent or treat dehydration.',
}

function findMedicineReference(name) {
  const value = name.trim().toLowerCase()

  if (!value) return null

  const match = Object.entries(medicineReference).find(([medicine]) =>
    value.includes(medicine) || medicine.includes(value),
  )

  return match ? match[1] : null
}

export { medicineReference, findMedicineReference }