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
