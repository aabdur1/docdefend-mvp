// Payer-specific documentation rules and reimbursement rates
// Medicare is the baseline — other payers layer additional requirements on top

export const PAYERS = {
  medicare: {
    id: 'medicare',
    name: 'Medicare',
    shortName: 'CMS',
    description: 'CMS/Medicare baseline guidelines',
    color: 'blue',
    rules: [],
    policies: [],
    rateOverrides: {},
  },
  united: {
    id: 'united',
    name: 'United Healthcare',
    shortName: 'UHC',
    description: 'UnitedHealthcare commercial plans',
    color: 'indigo',
    rules: [
      {
        id: 'uhc-conservative-therapy',
        applies_to: ['64483', '64490', '64635'],
        rule: 'Documented conservative therapy trial of 6+ weeks before interventional pain procedures',
        detail: 'United Healthcare requires documentation of at least 6 weeks of conservative therapy (physical therapy, medications, etc.) with dates and outcomes before approving interventional pain procedures.',
      },
      {
        id: 'uhc-pain-scale',
        applies_to: ['99214', '99215', '99204', '99205'],
        rule: 'Pain scale (VAS or NRS) documentation required for E/M Level 4+',
        detail: 'United Healthcare requires a documented pain scale score (Visual Analog Scale or Numeric Rating Scale) for higher-level E/M visits in pain management.',
      },
      {
        id: 'uhc-imaging',
        applies_to: ['64483', '64490', '64635'],
        rule: 'Imaging within 6 months required before epidurals or RFA',
        detail: 'United Healthcare requires MRI, CT, or X-ray results dated within 6 months of the procedure to establish medical necessity for epidural injections and radiofrequency ablation.',
      },
      {
        id: 'uhc-prior-auth',
        applies_to: ['64635', '64483'],
        rule: 'Prior authorization required for RFA and repeat epidural series',
        detail: 'United Healthcare requires prior authorization for radiofrequency ablation (64635) and repeat epidural injection series. Documentation must include prior procedure outcomes.',
      },
    ],
    policies: [
      'UHC requires precertification for most interventional pain procedures.',
      'Claims without documented conservative therapy trial are subject to automatic review.',
      'UHC uses InterQual criteria for medical necessity determination.',
    ],
    rateOverrides: {
      '99213': 108,
      '99214': 155,
      '99215': 220,
      '99203': 129,
      '99204': 196,
      '99205': 273,
      '64483': 268,
      '64490': 249,
      '20610': 124,
      '77003': 89,
      '64635': 535,
      '96372': 30,
    },
  },
  aetna: {
    id: 'aetna',
    name: 'Aetna',
    shortName: 'Aetna',
    description: 'Aetna commercial plans',
    color: 'purple',
    rules: [
      {
        id: 'aetna-conservative-therapy',
        applies_to: ['64483', '64490', '64635'],
        rule: 'Documented 4-6 week conservative therapy trial',
        detail: 'Aetna requires documentation of 4-6 weeks of conservative therapy including specific treatments tried, dates, and patient response before interventional procedures.',
      },
      {
        id: 'aetna-imaging',
        applies_to: ['64483', '64490', '64635'],
        rule: 'MRI or diagnostic imaging required before epidural or RFA',
        detail: 'Aetna requires MRI or equivalent imaging confirming pathology at the target level before approving epidural injections or radiofrequency ablation.',
      },
      {
        id: 'aetna-pt-trial',
        applies_to: ['64483', '64490', '64635'],
        rule: 'Documented physical therapy trial required',
        detail: 'Aetna requires documentation of a formal physical therapy trial (not just home exercises) with dates, duration, and outcomes before interventional procedures.',
      },
      {
        id: 'aetna-prior-auth-rfa',
        applies_to: ['64635'],
        rule: 'Prior authorization required for RFA (64635)',
        detail: 'Aetna requires prior authorization for radiofrequency ablation. Must include diagnostic block results showing 80%+ pain relief.',
      },
      {
        id: 'aetna-functional-outcomes',
        applies_to: ['64483', '64490', '64635', '99214', '99215'],
        rule: 'Functional outcome measures required',
        detail: 'Aetna requires documented functional outcome measures (e.g., Oswestry Disability Index, Roland-Morris) for repeat procedures and higher-level E/M visits.',
      },
    ],
    policies: [
      'Aetna follows Aetna Clinical Policy Bulletins (CPBs) for pain management coverage.',
      'Diagnostic medial branch blocks must show 80%+ relief before RFA approval.',
      'Repeat procedures require documented functional improvement from prior procedures.',
    ],
    rateOverrides: {
      '99213': 101,
      '99214': 148,
      '99215': 210,
      '99203': 122,
      '99204': 187,
      '99205': 260,
      '64483': 255,
      '64490': 238,
      '20610': 118,
      '77003': 84,
      '64635': 510,
      '96372': 28,
    },
  },
  bcbs: {
    id: 'bcbs',
    name: 'Blue Cross Blue Shield',
    shortName: 'BCBS',
    description: 'BCBS commercial plans',
    color: 'sky',
    rules: [
      {
        id: 'bcbs-psychosocial',
        applies_to: ['64483', '64490', '64635', '99214', '99215'],
        rule: 'Psychosocial screening documentation for chronic pain',
        detail: 'BCBS requires documented psychosocial screening (e.g., PHQ-9, GAD-7, or narrative assessment) for chronic pain patients receiving interventional procedures or higher-level E/M services.',
      },
      {
        id: 'bcbs-imaging-12mo',
        applies_to: ['64483', '64490', '64635'],
        rule: 'Imaging within 12 months for interventional procedures',
        detail: 'BCBS requires imaging studies (MRI, CT, or X-ray) dated within 12 months of the procedure date to support medical necessity.',
      },
      {
        id: 'bcbs-functional-status',
        applies_to: ['64483', '64490', '64635', '99214', '99215'],
        rule: 'Functional status and ADL documentation required',
        detail: 'BCBS requires documentation of functional status including specific Activities of Daily Living (ADL) limitations caused by the pain condition.',
      },
      {
        id: 'bcbs-repeat-procedures',
        applies_to: ['64483', '64490', '64635'],
        rule: 'Prior procedure response documentation for repeat procedures',
        detail: 'BCBS requires documented response to prior procedures (percentage pain relief, duration of relief, functional improvement) before approving repeat interventional procedures.',
      },
    ],
    policies: [
      'BCBS uses evidence-based medical policy criteria specific to each state plan.',
      'Chronic pain management requires a documented multimodal treatment plan.',
      'BCBS may require peer-to-peer review for procedures denied on initial submission.',
    ],
    rateOverrides: {
      '99213': 104,
      '99214': 151,
      '99215': 215,
      '99203': 125,
      '99204': 191,
      '99205': 266,
      '64483': 261,
      '64490': 244,
      '20610': 121,
      '77003': 87,
      '64635': 522,
      '96372': 29,
    },
  },
};

// Medicare baseline rates (same as in prompt.js)
const MEDICARE_RATES = {
  '99213': 92,
  '99214': 132,
  '99215': 187,
  '99203': 110,
  '99204': 167,
  '99205': 232,
  '64483': 225,
  '64490': 210,
  '20610': 105,
  '77003': 75,
  '64635': 450,
  '96372': 25,
};

/**
 * Get payer metadata for UI dropdown (id, name, shortName, description, color)
 */
export function getPayerList() {
  return Object.values(PAYERS).map(({ id, name, shortName, description, color }) => ({
    id,
    name,
    shortName,
    description,
    color,
  }));
}

/**
 * Get formatted payer-specific rules string for injection into Claude prompt.
 * Returns empty string for medicare or unknown payer.
 */
export function getPayerRules(payerId) {
  if (!payerId || payerId === 'medicare') return '';

  const payer = PAYERS[payerId];
  if (!payer || payer.rules.length === 0) return '';

  let rulesText = `\n\nPAYER-SPECIFIC REQUIREMENTS (${payer.name}):\n`;
  rulesText += `This claim will be submitted to ${payer.name}. In addition to standard CMS/Medicare documentation requirements, evaluate the note against these payer-specific rules:\n\n`;

  payer.rules.forEach((rule, idx) => {
    rulesText += `${idx + 1}. [Applies to: ${rule.applies_to.join(', ')}] ${rule.rule}\n`;
    rulesText += `   Detail: ${rule.detail}\n\n`;
  });

  if (payer.policies.length > 0) {
    rulesText += `General ${payer.name} policies:\n`;
    payer.policies.forEach(policy => {
      rulesText += `- ${policy}\n`;
    });
  }

  return rulesText;
}

/**
 * Get payer-specific reimbursement rate for a CPT code.
 * Falls back to Medicare rate if no payer override exists.
 */
export function getPayerRate(payerId, cptCode) {
  if (!payerId || payerId === 'medicare') {
    return MEDICARE_RATES[cptCode] || null;
  }

  const payer = PAYERS[payerId];
  if (!payer) return MEDICARE_RATES[cptCode] || null;

  return payer.rateOverrides[cptCode] || MEDICARE_RATES[cptCode] || null;
}

/**
 * Get formatted rate table string for prompt injection.
 * Returns empty string for medicare (rates already in base prompt).
 */
export function getPayerRateTable(payerId) {
  if (!payerId || payerId === 'medicare') return '';

  const payer = PAYERS[payerId];
  if (!payer || Object.keys(payer.rateOverrides).length === 0) return '';

  let rateText = `\n\nPAYER-SPECIFIC REIMBURSEMENT RATES (${payer.name}):\n`;
  rateText += `Use these ${payer.name} commercial rates instead of Medicare rates for financial estimates:\n`;

  const rateEntries = Object.entries(payer.rateOverrides)
    .map(([code, rate]) => `${code}=$${rate}`)
    .join(', ');

  rateText += rateEntries + '\n';
  rateText += `Note: ${payer.name} commercial rates are generally higher than Medicare. Use these rates for all financial impact calculations.\n`;

  return rateText;
}
