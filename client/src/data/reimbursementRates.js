// Approximate Medicare national average reimbursement rates (2024)
// Used for financial impact estimates in the defensibility report
export const reimbursementRates = {
  // E/M - Established Patient
  '99213': { rate: 92, description: 'E/M Level 3, established patient' },
  '99214': { rate: 132, description: 'E/M Level 4, established patient' },
  '99215': { rate: 187, description: 'E/M Level 5, established patient' },
  // E/M - New Patient
  '99203': { rate: 110, description: 'E/M Level 3, new patient' },
  '99204': { rate: 167, description: 'E/M Level 4, new patient' },
  '99205': { rate: 232, description: 'E/M Level 5, new patient' },
  // Preventive Visits
  '99391': { rate: 78, description: 'Preventive visit, age 1-4' },
  '99392': { rate: 89, description: 'Preventive visit, age 5-11' },
  '99393': { rate: 99, description: 'Preventive visit, age 12-17' },
  '99395': { rate: 110, description: 'Preventive visit, age 18-39' },
  '99396': { rate: 126, description: 'Preventive visit, age 40-64' },
  '99397': { rate: 139, description: 'Preventive visit, age 65+' },
  '99381': { rate: 98, description: 'New patient preventive, age 1-4' },
  // Screening & Administration
  '96127': { rate: 5, description: 'Behavioral screening (PHQ-9, GAD-7)' },
  '90471': { rate: 17, description: 'Immunization administration' },
  // Procedures
  '64483': { rate: 225, description: 'Epidural injection, lumbar/sacral' },
  '64490': { rate: 210, description: 'Facet joint injection, lumbar' },
  '20610': { rate: 105, description: 'Large joint injection' },
  '77003': { rate: 75, description: 'Fluoroscopic guidance' },
  '64635': { rate: 450, description: 'Radiofrequency ablation, lumbar' },
  '96372': { rate: 25, description: 'Therapeutic injection' },
};

export function getRate(code) {
  return reimbursementRates[code]?.rate || 0;
}

export function getRateInfo(code) {
  return reimbursementRates[code] || null;
}

export function isEMCode(code) {
  return /^99\d{3}$/.test(code);
}
