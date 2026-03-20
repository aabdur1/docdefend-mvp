// Payer-specific E/M downcoding detection rules
// Loads dynamically from server/data/ JSON files (updated by n8n pipeline)
// Falls back to hardcoded constants if JSON files are missing or invalid

import { getPayerRate } from './payerRules.js';
import { getPolicies, getBenchmarks } from './rulesLoader.js';

// ─── Dynamic Getters (JSON-first, hardcoded fallback) ────────────────────────

/**
 * Get a single payer's downcoding policy. Reads from loaded JSON first,
 * falls back to hardcoded DOWNCODE_POLICIES_FALLBACK if not loaded.
 */
export function getPolicy(payerId) {
  const loaded = getPolicies();
  if (loaded?.policies?.[payerId]) return loaded.policies[payerId];
  return DOWNCODE_POLICIES_FALLBACK[payerId] || null;
}

/**
 * Get peer benchmark data for a specialty. Reads from loaded JSON first,
 * falls back to hardcoded PEER_BENCHMARKS_FALLBACK.
 */
export function getPeerBenchmark(specialty) {
  const loaded = getBenchmarks();
  if (loaded?.benchmarks?.[specialty]) return loaded.benchmarks[specialty];
  return PEER_BENCHMARKS_FALLBACK[specialty] || PEER_BENCHMARKS_FALLBACK.default;
}

// ─── Hardcoded Fallbacks ─────────────────────────────────────────────────────
// Used when JSON data files are missing or invalid (e.g., first deploy, corrupted file)

const DOWNCODE_POLICIES_FALLBACK = {
  cigna: {
    id: 'cigna_r49',
    name: 'Cigna R49 — E/M Coding Accuracy',
    payer: 'Cigna',
    effectiveDate: '2025-10-01',
    status: 'active', // paused for CA HMO only; active elsewhere
    targetCodes: ['99204', '99205', '99214', '99215', '99244', '99245'],
    mechanism: 'one-level-down',
    description: 'Automatic one-level downcode when claim-based diagnosis codes do not appear to justify the E/M complexity level, compared against specialty peer benchmarks.',
    bypassRules: 'Provider must accumulate 5+ adjusted claims, then request bypass. 80% of appealed claims must be upheld to grant bypass.',
    source: 'https://providernewsroom.com/cigna-healthcare/new-reimbursement-policy-for-professional-evaluation-and-management-services-claims-effective-october-1-2025/',
  },
  aetna: {
    id: 'aetna_ccrp',
    name: 'Aetna CCRP — Claim & Code Review Program',
    payer: 'Aetna',
    effectiveDate: '2025-03-01',
    status: 'active', // expanded to MA + student health Sep 2025
    targetCodes: ['99204', '99205', '99214', '99215'],
    mechanism: 'one-level-down',
    description: 'Targets top 3% of in-network providers by coding intensity who submit higher-level E/M codes than CMS/AMA benchmarks. Claims to affect ~3% of providers.',
    bypassRules: 'Practice can pursue early removal by successfully appealing 75% of downcoded claims. Default inclusion duration: 1 year.',
    source: 'https://www.revquestrcm.com/post/aetna-ccrp-and-cigna-r49',
  },
  united: {
    id: 'uhc_downcode',
    name: 'UHC E/M Level Adjustment',
    payer: 'United Healthcare',
    effectiveDate: '2019-06-01',
    status: 'active',
    targetCodes: ['99204', '99205', '99214', '99215'],
    mechanism: 'adjust-to-deemed-level',
    description: 'UHC adjusts E/M claims to the level they deem appropriate based on claim data, rather than issuing outright denials. Shifted from denial to downcoding in Q2 2019.',
    bypassRules: 'No formal bypass program. Individual claim appeals accepted.',
    source: 'https://www.aafp.org/pubs/fpm/blogs/gettingpaid/entry/UHC_downcoding.html',
  },
  bcbs: {
    id: 'anthem_bcbs',
    name: 'Anthem BCBS E/M Coding Review',
    payer: 'Blue Cross Blue Shield (Anthem)',
    effectiveDate: '2025-11-13',
    status: 'paused_ca', // paused in CA until 2026-03-01; active elsewhere
    targetCodes: ['99204', '99205', '99214', '99215'],
    mechanism: 'one-level-down',
    description: 'Targets physicians coding at a higher E/M level compared to peers with similar risk-adjusted members. Policy lacks transparency on selection criteria.',
    bypassRules: 'No formal bypass published. Paused in California pending DMHC review.',
    source: 'https://www.beckerspayer.com/payer/anthem-blue-cross-of-california-to-halt-e-m-downcoding-until-march-pending-review/',
  },
};

// One-level-down mapping for E/M codes
const ONE_LEVEL_DOWN = {
  '99214': '99213',
  '99215': '99214',
  '99204': '99203',
  '99205': '99204',
  '99244': '99243',
  '99245': '99244',
};

// Numeric E/M levels for comparison
const EM_LEVEL_NUM = {
  '99211': 1, '99212': 2, '99213': 3, '99214': 4, '99215': 5,
  '99202': 2, '99203': 3, '99204': 4, '99205': 5,
  '99243': 3, '99244': 4, '99245': 5,
};

// ─── ICD-10 Complexity Classification ────────────────────────────────────────
// Maps diagnosis code prefixes to MDM complexity tiers
// This approximates how payer algorithms categorize diagnoses
//
// Tiers correspond to CMS 2021+ MDM framework:
//   SELF_LIMITED  → supports 99213 (low MDM)
//   STABLE_CHRONIC → counts toward 99214 if 2+ present (moderate MDM)
//   EXACERBATION  → supports 99214 alone (moderate MDM)
//   SEVERE        → supports 99215 (high MDM)

const COMPLEXITY_TIERS = {
  SELF_LIMITED: 1,   // single acute uncomplicated problem
  STABLE_CHRONIC: 2, // stable chronic condition (need 2+ for level 4)
  EXACERBATION: 3,   // chronic with complication or mild exacerbation
  SEVERE: 4,         // acute/chronic posing threat to life or bodily function
};

// Exact matches first, then prefix matches (longer prefixes win)
// Organized by clinical category for maintainability
const DX_COMPLEXITY_MAP = {
  // ── Self-limited / minor acute ──
  'J06.9':   'SELF_LIMITED',   // Acute upper respiratory infection
  'J06':     'SELF_LIMITED',   // URI family
  'J01':     'SELF_LIMITED',   // Acute sinusitis
  'J02':     'SELF_LIMITED',   // Acute pharyngitis
  'J20':     'SELF_LIMITED',   // Acute bronchitis
  'N39.0':   'SELF_LIMITED',   // UTI
  'H10':     'SELF_LIMITED',   // Conjunctivitis
  'B34.9':   'SELF_LIMITED',   // Viral infection, unspecified
  'L03':     'SELF_LIMITED',   // Cellulitis (uncomplicated)
  'S93':     'SELF_LIMITED',   // Ankle sprain
  'S83':     'SELF_LIMITED',   // Knee sprain
  'R51':     'SELF_LIMITED',   // Headache
  'K08':     'SELF_LIMITED',   // Dental disorders
  'H66':     'SELF_LIMITED',   // Otitis media

  // ── Stable chronic conditions ──
  'I10':     'STABLE_CHRONIC', // Essential hypertension
  'E78':     'STABLE_CHRONIC', // Hyperlipidemia family
  'E11.9':   'STABLE_CHRONIC', // Type 2 DM without complications
  'E03.9':   'STABLE_CHRONIC', // Hypothyroidism
  'M17':     'STABLE_CHRONIC', // Knee osteoarthritis
  'M19':     'STABLE_CHRONIC', // Other osteoarthritis
  'F41.1':   'STABLE_CHRONIC', // Generalized anxiety disorder
  'F32':     'STABLE_CHRONIC', // Major depressive disorder
  'F33':     'STABLE_CHRONIC', // Recurrent depressive disorder
  'G47.00':  'STABLE_CHRONIC', // Insomnia, unspecified
  'G47.0':   'STABLE_CHRONIC', // Insomnia family
  'M54.5':   'STABLE_CHRONIC', // Low back pain (unspecified)
  'M54.50':  'STABLE_CHRONIC', // Low back pain (unspecified site)
  'M54.2':   'STABLE_CHRONIC', // Cervicalgia
  'K21':     'STABLE_CHRONIC', // GERD
  'J45.2':   'STABLE_CHRONIC', // Mild intermittent asthma
  'J45.3':   'STABLE_CHRONIC', // Mild persistent asthma (stable)
  'I25.10':  'STABLE_CHRONIC', // CAD, stable
  'N40':     'STABLE_CHRONIC', // BPH
  'E66':     'STABLE_CHRONIC', // Obesity
  'G43':     'STABLE_CHRONIC', // Migraine (stable/managed)
  'M79.3':   'STABLE_CHRONIC', // Panniculitis
  'R73':     'STABLE_CHRONIC', // Prediabetes / elevated glucose
  'Z00':     'SELF_LIMITED',   // Wellness/preventive (not a problem)

  // ── Chronic with exacerbation / complication ──
  'E11.65':  'EXACERBATION',   // DM2 with hyperglycemia
  'E11.6':   'EXACERBATION',   // DM2 with complications (general)
  'E11.2':   'EXACERBATION',   // DM2 with kidney complications
  'E11.3':   'EXACERBATION',   // DM2 with ophthalmic complications
  'E11.4':   'EXACERBATION',   // DM2 with neurological complications
  'E11.5':   'EXACERBATION',   // DM2 with circulatory complications
  'M47.81':  'EXACERBATION',   // Spondylosis with radiculopathy
  'M47.816': 'EXACERBATION',   // Spondylosis w/ radiculopathy, lumbar
  'M47.812': 'EXACERBATION',   // Spondylosis w/ radiculopathy, cervical
  'M51.16':  'EXACERBATION',   // Intervertebral disc disorder w/ radiculopathy, lumbar
  'M51.06':  'EXACERBATION',   // Intervertebral disc disorder w/ myelopathy, lumbar
  'M51':     'EXACERBATION',   // Intervertebral disc disorders (with complication)
  'G89.29':  'EXACERBATION',   // Other chronic pain
  'G89.4':   'EXACERBATION',   // Chronic pain syndrome
  'M54.3':   'EXACERBATION',   // Sciatica (indicates radiculopathy)
  'I50':     'EXACERBATION',   // Heart failure
  'J44.1':   'EXACERBATION',   // COPD with acute exacerbation
  'J45.31':  'EXACERBATION',   // Mild persistent asthma w/ exacerbation
  'J45.41':  'EXACERBATION',   // Moderate persistent asthma w/ exacerbation
  'J45.51':  'EXACERBATION',   // Severe persistent asthma w/ exacerbation
  'N18.3':   'EXACERBATION',   // CKD stage 3
  'N18.4':   'EXACERBATION',   // CKD stage 4
  'E11.1':   'EXACERBATION',   // DM2 with ketoacidosis

  // ── Severe / life-threatening ──
  'I21':     'SEVERE',         // Acute myocardial infarction
  'I63':     'SEVERE',         // Cerebral infarction / stroke
  'A41':     'SEVERE',         // Sepsis
  'J96':     'SEVERE',         // Respiratory failure
  'N17':     'SEVERE',         // Acute kidney injury
  'N18.5':   'SEVERE',         // CKD stage 5
  'N18.6':   'SEVERE',         // End-stage renal disease
  'I46':     'SEVERE',         // Cardiac arrest
  'R65.2':   'SEVERE',         // Severe sepsis
  'E10.1':   'SEVERE',         // DM1 with ketoacidosis
  'E11.0':   'SEVERE',         // DM2 with hyperosmolarity
  'J44.0':   'SEVERE',         // COPD with acute lower respiratory infection
};

// ─── CMS Peer Benchmarks by Specialty ────────────────────────────────────────
// Approximate E/M utilization distribution (% of established patient visits)
// Source: CMS Medicare Physician & Other Practitioners utilization data
// These are what payers like Cigna/Aetna compare providers against

const PEER_BENCHMARKS_FALLBACK = {
  family_medicine: {
    '99213': 0.45,  // 45% of established visits
    '99214': 0.38,  // 38%
    '99215': 0.08,  // 8%
    label: 'Family Medicine',
  },
  internal_medicine: {
    '99213': 0.35,
    '99214': 0.42,
    '99215': 0.12,
    label: 'Internal Medicine',
  },
  pain_management: {
    '99213': 0.25,
    '99214': 0.45,
    '99215': 0.20,
    label: 'Pain Management',
  },
  emergency_medicine: {
    '99213': 0.15,
    '99214': 0.30,
    '99215': 0.35,
    label: 'Emergency Medicine',
  },
  default: {
    '99213': 0.38,
    '99214': 0.40,
    '99215': 0.12,
    label: 'All Specialties',
  },
};

// Pain management procedure codes — used to infer specialty
const PAIN_PROCEDURE_CODES = new Set([
  '64483', '64490', '64635', '64636', '77003', '20610',
  '62322', '62323', '64493', '64494', '64495',
]);

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Classify a single ICD-10 code into a complexity tier.
 * Tries exact match first, then progressively shorter prefixes.
 */
export function classifyDiagnosis(code) {
  if (!code) return null;
  const normalized = code.trim().toUpperCase();

  // Try exact match, then progressively shorter prefixes
  // E11.65 → E11.6 → E11 → E1 → E
  let prefix = normalized;
  while (prefix.length >= 2) {
    if (DX_COMPLEXITY_MAP[prefix]) {
      return {
        code: normalized,
        tier: DX_COMPLEXITY_MAP[prefix],
        tierLevel: COMPLEXITY_TIERS[DX_COMPLEXITY_MAP[prefix]],
        matchedOn: prefix,
      };
    }
    // Remove last character (skip the dot)
    prefix = prefix.endsWith('.') ? prefix.slice(0, -1) : prefix.slice(0, -1);
  }

  // Default: treat unknown codes as stable chronic (conservative assumption)
  return {
    code: normalized,
    tier: 'STABLE_CHRONIC',
    tierLevel: COMPLEXITY_TIERS.STABLE_CHRONIC,
    matchedOn: 'default',
  };
}

/**
 * Classify all ICD-10 codes and return structured summary.
 */
export function classifyDiagnoses(icd10Codes) {
  const classified = icd10Codes.map(classifyDiagnosis).filter(Boolean);

  const selfLimited = classified.filter(d => d.tier === 'SELF_LIMITED');
  const stableChronic = classified.filter(d => d.tier === 'STABLE_CHRONIC');
  const exacerbation = classified.filter(d => d.tier === 'EXACERBATION');
  const severe = classified.filter(d => d.tier === 'SEVERE');

  return {
    all: classified,
    selfLimited,
    stableChronic,
    exacerbation,
    severe,
    highestTier: severe.length > 0 ? 'SEVERE'
      : exacerbation.length > 0 ? 'EXACERBATION'
      : stableChronic.length > 0 ? 'STABLE_CHRONIC'
      : 'SELF_LIMITED',
    stableChronicCount: stableChronic.length,
  };
}

/**
 * Determine the expected E/M level based on diagnosis complexity.
 * This approximates what payer algorithms conclude from claim data alone.
 *
 * CMS 2021+ MDM framework mapping:
 *   - 1 self-limited problem → 99213
 *   - 2+ stable chronic conditions → 99214
 *   - 1 chronic with exacerbation → 99214
 *   - 1 condition posing threat to life → 99215
 */
export function getExpectedEmLevel(icd10Codes, isNewPatient = false) {
  const dx = classifyDiagnoses(icd10Codes);

  let expectedLevel;
  let rationale;

  if (dx.severe.length > 0) {
    expectedLevel = 5;
    rationale = `Diagnosis ${dx.severe[0].code} indicates an acute/chronic condition posing threat to life or bodily function — supports Level 5 MDM.`;
  } else if (dx.exacerbation.length > 0) {
    expectedLevel = 4;
    rationale = `Diagnosis ${dx.exacerbation[0].code} indicates a chronic condition with complication or exacerbation — supports Level 4 MDM.`;
  } else if (dx.stableChronicCount >= 2) {
    expectedLevel = 4;
    rationale = `${dx.stableChronicCount} stable chronic conditions documented (${dx.stableChronic.map(d => d.code).join(', ')}) — 2+ stable chronic conditions support Level 4 MDM.`;
  } else if (dx.stableChronicCount === 1) {
    expectedLevel = 3;
    rationale = `Single stable chronic condition (${dx.stableChronic[0].code}) without documented exacerbation — payer algorithms typically map this to Level 3.`;
  } else {
    expectedLevel = 3;
    rationale = `Diagnosis codes indicate self-limited or minor problems — supports Level 3 MDM.`;
  }

  // Map numeric level to CPT code
  const codeMap = isNewPatient
    ? { 2: '99202', 3: '99203', 4: '99204', 5: '99205' }
    : { 2: '99212', 3: '99213', 4: '99214', 5: '99215' };

  return {
    level: expectedLevel,
    code: codeMap[expectedLevel],
    rationale,
    diagnosisBreakdown: dx,
  };
}

/**
 * Infer specialty from CPT codes.
 */
export function inferSpecialty(cptCodes) {
  if (!cptCodes || cptCodes.length === 0) return 'default';
  const hasPainProcedures = cptCodes.some(c => PAIN_PROCEDURE_CODES.has(c));
  return hasPainProcedures ? 'pain_management' : 'family_medicine';
}

/**
 * Main function: check downcoding risk for a claim.
 *
 * @param {string} payerId - 'medicare' | 'united' | 'aetna' | 'bcbs' | 'cigna'
 * @param {string} emCode - The E/M code being submitted (e.g., '99214')
 * @param {string[]} icd10Codes - Array of ICD-10 diagnosis codes
 * @param {string[]} [cptCodes] - All CPT codes (used to infer specialty)
 * @returns {object} Downcode risk assessment
 */
export function checkDowncodeRisk(payerId, emCode, icd10Codes, cptCodes = []) {
  // Only assess E/M codes
  if (!emCode || !EM_LEVEL_NUM[emCode]) {
    return { riskLevel: 'NONE', reason: 'Not an E/M code' };
  }

  // Medicare doesn't algorithmically downcode (they audit instead)
  if (!payerId || payerId === 'medicare') {
    return { riskLevel: 'NONE', reason: 'Medicare does not use algorithmic downcoding programs' };
  }

  // Check if this payer has a downcoding policy
  const policy = getPolicy(payerId);
  if (!policy) {
    return { riskLevel: 'NONE', reason: 'No known downcoding policy for this payer' };
  }

  // Check if this E/M code is targeted by the policy
  if (!policy.targetCodes.includes(emCode)) {
    return {
      riskLevel: 'LOW',
      reason: `${policy.payer}'s ${policy.name} does not target ${emCode}. Only targets: ${policy.targetCodes.join(', ')}.`,
      policy: { name: policy.name, status: policy.status },
    };
  }

  // Classify diagnoses and determine expected E/M level
  const isNewPatient = emCode.startsWith('992') && parseInt(emCode.slice(2)) <= 5 && parseInt(emCode.slice(2)) >= 2;
  const expected = getExpectedEmLevel(icd10Codes, emCode.startsWith('992') && parseInt(emCode[3]) === 0);

  const submittedLevel = EM_LEVEL_NUM[emCode];
  const expectedLevel = expected.level;
  const levelDiff = submittedLevel - expectedLevel;

  // Infer specialty for benchmark context
  const specialty = inferSpecialty(cptCodes);
  const benchmark = getPeerBenchmark(specialty);

  // Calculate financial impact
  const submittedRate = getPayerRate(payerId, emCode) || getPayerRate('medicare', emCode) || 0;
  const downcodedCode = ONE_LEVEL_DOWN[emCode];
  const downcodedRate = downcodedCode
    ? (getPayerRate(payerId, downcodedCode) || getPayerRate('medicare', downcodedCode) || 0)
    : 0;
  const loss = submittedRate - downcodedRate;

  // Build prevention tips
  const tips = buildPreventionTips(emCode, expected, levelDiff);

  // Determine risk level
  if (levelDiff >= 2) {
    return {
      riskLevel: 'HIGH',
      predictedAdjustment: downcodedCode ? { from: emCode, to: downcodedCode } : null,
      policy: {
        name: policy.name,
        payer: policy.payer,
        status: policy.status,
        effectiveDate: policy.effectiveDate,
        mechanism: policy.mechanism,
      },
      rationale: `${policy.payer}'s algorithm will likely flag this claim. You submitted ${emCode} (Level ${submittedLevel}) but the diagnosis codes suggest Level ${expectedLevel} complexity. ${expected.rationale}`,
      financialImpact: {
        submittedRate,
        predictedRate: downcodedRate,
        loss,
        formatted: {
          submitted: `$${submittedRate}`,
          predicted: `$${downcodedRate}`,
          loss: `-$${loss}`,
        },
      },
      diagnosisAnalysis: expected.diagnosisBreakdown,
      peerBenchmark: {
        specialty: benchmark.label,
        expectedDistribution: benchmark,
      },
      preventionTips: tips,
    };
  }

  if (levelDiff === 1) {
    return {
      riskLevel: 'MEDIUM',
      predictedAdjustment: downcodedCode ? { from: emCode, to: downcodedCode } : null,
      policy: {
        name: policy.name,
        payer: policy.payer,
        status: policy.status,
        effectiveDate: policy.effectiveDate,
        mechanism: policy.mechanism,
      },
      rationale: `${policy.payer}'s algorithm may flag this claim. You submitted ${emCode} (Level ${submittedLevel}) but the diagnosis codes alone suggest Level ${expectedLevel}. ${expected.rationale} However, documentation of data review complexity or risk management may justify the higher level even if claim data appears borderline.`,
      financialImpact: {
        submittedRate,
        predictedRate: downcodedRate,
        loss,
        formatted: {
          submitted: `$${submittedRate}`,
          predicted: `$${downcodedRate}`,
          loss: `-$${loss}`,
        },
      },
      diagnosisAnalysis: expected.diagnosisBreakdown,
      peerBenchmark: {
        specialty: benchmark.label,
        expectedDistribution: benchmark,
      },
      preventionTips: tips,
    };
  }

  // No mismatch — diagnoses support the E/M level
  return {
    riskLevel: 'LOW',
    predictedAdjustment: null,
    policy: {
      name: policy.name,
      payer: policy.payer,
      status: policy.status,
    },
    rationale: `Diagnosis complexity aligns with ${emCode}. ${expected.rationale} ${policy.payer}'s algorithm is unlikely to flag this claim based on diagnosis data alone.`,
    financialImpact: {
      submittedRate,
      predictedRate: submittedRate,
      loss: 0,
      formatted: {
        submitted: `$${submittedRate}`,
        predicted: `$${submittedRate}`,
        loss: '$0',
      },
    },
    diagnosisAnalysis: expected.diagnosisBreakdown,
    preventionTips: [],
  };
}

/**
 * Build actionable prevention tips based on the downcode risk.
 */
function buildPreventionTips(emCode, expected, levelDiff) {
  if (levelDiff <= 0) return [];

  const tips = [];
  const dx = expected.diagnosisBreakdown;

  // Tip 1: Add complexity-elevating diagnoses if documented
  if (dx.stableChronicCount < 2 && dx.exacerbation.length === 0) {
    tips.push(
      'If the patient has additional chronic conditions being actively managed (e.g., diabetes, hypertension, anxiety), ensure they are listed as diagnosis codes on the claim. Two or more stable chronic conditions support Level 4 MDM.'
    );
  }

  // Tip 2: Upgrade stable chronic to exacerbation if applicable
  if (dx.stableChronic.length > 0 && dx.exacerbation.length === 0) {
    tips.push(
      'If any chronic condition had a change in treatment, dosage adjustment, or worsening symptoms during this visit, code it as an exacerbation rather than stable (e.g., E11.65 instead of E11.9 if hyperglycemia was addressed). A single chronic condition with exacerbation alone supports Level 4.'
    );
  }

  // Tip 3: Time-based billing
  tips.push(
    'If the visit exceeded the time threshold (e.g., 30+ minutes for 99214, 40+ minutes for 99215), consider time-based billing. Time-based E/M bypasses MDM-based downcoding algorithms because the payer cannot dispute documented time.'
  );

  // Tip 4: Document data complexity
  if (levelDiff >= 1) {
    tips.push(
      'Ensure the note documents data reviewed: external records, imaging review, lab results, or independent historian. Even if diagnoses appear straightforward, moderate data complexity supports Level 4 MDM.'
    );
  }

  // Tip 5: Document risk
  if (levelDiff >= 1) {
    tips.push(
      'Document prescription drug management explicitly (including drug names, dosage changes, monitoring). Prescription drug management establishes moderate risk in MDM, supporting Level 4.'
    );
  }

  // Tip 6: Appeal preparation
  if (levelDiff >= 2) {
    tips.push(
      'If this claim is downcoded, appeal with the full clinical note. Payer algorithms evaluate claim data only — they do not read the note. An appeal that demonstrates documented MDM complexity overturns the algorithmic downcode in most cases.'
    );
  }

  return tips;
}

/**
 * Get list of all payer downcoding policies (for UI display).
 */
export function getDowncodePolicies() {
  const loaded = getPolicies();
  const source = loaded?.policies || DOWNCODE_POLICIES_FALLBACK;
  return Object.values(source).map(p => ({
    id: p.id,
    name: p.name,
    payer: p.payer,
    status: p.status,
    effectiveDate: p.effectiveDate,
    targetCodes: p.targetCodes,
  }));
}
