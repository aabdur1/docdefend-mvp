// System prompts for smart suggestions features

export const codeSuggestionPrompt = `You are a certified medical coder (CPC, CCS) specializing in pain management coding. Your task is to analyze a clinical note and suggest the most appropriate CPT and ICD-10 codes based on the documented services and diagnoses.

IMPORTANT RULES:
- Only suggest codes that are clearly supported by the documentation
- For E/M codes, evaluate the level based on MDM complexity (2021+ guidelines)
- For procedures, only suggest if the note documents the procedure was performed
- Include confidence level for each suggestion
- Provide brief rationale for each code

Respond in this exact JSON format:
{
  "cptCodes": [
    {
      "code": "string",
      "description": "string",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "rationale": "string - brief explanation of why this code applies"
    }
  ],
  "icd10Codes": [
    {
      "code": "string",
      "description": "string",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "rationale": "string - brief explanation of why this diagnosis applies"
    }
  ],
  "warnings": ["string - any coding concerns or documentation gaps that affect code selection"]
}

Return ONLY valid JSON with no other text.`;

export const addendumPrompt = `You are a clinical documentation improvement (CDI) specialist. Your task is to generate a compliant addendum that addresses specific documentation gaps identified in a clinical note.

The addendum must:
- Be written in proper clinical language
- Include only factual, defensible statements
- Address each missing element specifically
- Be formatted for easy copy-paste into an EHR
- Include a timestamp placeholder and addendum header
- NOT fabricate clinical information - use placeholders like [SPECIFY] where the provider needs to add specific details

Respond in this exact JSON format:
{
  "addendumText": "string - the complete addendum text ready to copy",
  "instructions": ["string - guidance for the provider on completing any placeholders"],
  "elementsAddressed": ["string - list of gaps this addendum addresses"]
}

Return ONLY valid JSON with no other text.`;

export const templateLibrary = [
  {
    id: "em-established-level4",
    name: "E/M Level 4 - Established Patient",
    category: "Evaluation & Management",
    cptCode: "99214",
    description: "Comprehensive template for moderate complexity visit",
    template: `CHIEF COMPLAINT:
[Primary reason for visit]

HISTORY OF PRESENT ILLNESS:
[Patient name] is a [age]-year-old [gender] presenting for [reason].
Location: [anatomical location with laterality]
Quality: [description of pain/symptoms]
Severity: [X]/10 on numeric pain scale
Duration: [timeframe]
Timing: [constant/intermittent, pattern]
Context: [what makes it better/worse]
Associated symptoms: [related symptoms]
Current treatment response: [effectiveness of current management]

REVIEW OF SYSTEMS:
Constitutional: [positive/negative findings]
Musculoskeletal: [positive/negative findings]
Neurological: [positive/negative findings]
[Additional relevant systems]

CURRENT MEDICATIONS:
- [Medication 1, dose, frequency]
- [Medication 2, dose, frequency]

ALLERGIES: [allergies or NKDA]

PHYSICAL EXAMINATION:
Vital Signs: BP [X/X], HR [X], SpO2 [X]%
General: [general appearance, distress level]
[Relevant system exam with specific findings]
Neurological: [strength, sensation, reflexes as applicable]

ASSESSMENT:
1. [Primary diagnosis] - [status: stable/worsening/improving]
2. [Secondary diagnosis if applicable]

MEDICAL DECISION MAKING:
Number/Complexity of Problems: [Moderate - chronic illness with mild exacerbation OR 2+ chronic conditions]
Data Reviewed: [Review of prior external notes/test results/imaging]
Risk: [Moderate - prescription drug management]

PLAN:
1. [Treatment plan item 1]
2. [Treatment plan item 2]
3. [Follow-up timeframe]

Patient verbalized understanding of the plan and agrees to proceed.`
  },
  {
    id: "em-established-level3",
    name: "E/M Level 3 - Established Patient",
    category: "Evaluation & Management",
    cptCode: "99213",
    description: "Template for low complexity follow-up visit",
    template: `CHIEF COMPLAINT:
[Primary reason for visit]

HISTORY OF PRESENT ILLNESS:
[Patient name] is a [age]-year-old [gender] returning for follow-up of [condition].
Current pain level: [X]/10
Compared to last visit: [improved/stable/worse]
Current treatment: [brief summary of current regimen]
Treatment response: [effectiveness]

CURRENT MEDICATIONS:
- [Medication list with doses]

PHYSICAL EXAMINATION:
Vital Signs: BP [X/X], HR [X]
General: [appearance, distress level]
[Focused exam relevant to chief complaint]

ASSESSMENT:
1. [Primary diagnosis] - [stable/controlled]

PLAN:
1. Continue current regimen
2. [Any modifications]
3. Return in [timeframe]`
  },
  {
    id: "epidural-injection",
    name: "Lumbar Epidural Steroid Injection",
    category: "Procedures",
    cptCode: "64483",
    description: "Complete procedure note for lumbar/sacral epidural",
    template: `PROCEDURE NOTE

PROCEDURE: Lumbar Epidural Steroid Injection
DATE: [Date]
PHYSICIAN: [Provider name]

PREOPERATIVE DIAGNOSIS:
[Diagnosis with laterality, e.g., Left L5 radiculopathy secondary to L4-5 disc herniation]

POSTOPERATIVE DIAGNOSIS: Same

INDICATION/MEDICAL NECESSITY:
Patient has [diagnosis] confirmed by [MRI/clinical findings]. Has failed conservative management including [list failed treatments: PT, NSAIDs, etc.] over [timeframe]. This injection is being performed for [diagnostic/therapeutic] purposes.

CONSENT:
Risks, benefits, and alternatives were discussed with the patient including but not limited to: infection, bleeding, nerve injury, dural puncture, allergic reaction, and lack of relief. Patient verbalized understanding and signed written informed consent.

PROCEDURE DETAILS:
The patient was placed in [prone/lateral] position on the fluoroscopy table. The [left/right] [L4-5/L5-S1] level was identified using fluoroscopic guidance. The skin was prepped with chlorhexidine and draped in sterile fashion.

Local anesthesia was achieved with [X] mL of 1% lidocaine subcutaneously. A [22/25]-gauge Tuohy needle was advanced using [interlaminar/transforaminal] approach under intermittent fluoroscopic guidance.

[For transforaminal]: The needle was positioned in the [left/right] [L4-5/L5-S1] foramen in the safe triangle.

Epidural space was confirmed by [loss of resistance to air/saline / contrast spread]. [X] mL of [contrast agent] was injected showing appropriate epidural spread pattern without intravascular or intrathecal uptake.

A mixture of [80mg Depo-Medrol/40mg triamcinolone] and [X] mL of [0.25% bupivacaine/1% lidocaine] was injected.

The needle was removed and a sterile bandage was applied.

ESTIMATED BLOOD LOSS: Minimal
COMPLICATIONS: None
SPECIMENS: None

DISPOSITION:
Patient tolerated the procedure well. Monitored for [20/30] minutes post-procedure. Vital signs stable. No immediate complications. Discharged home in stable condition with post-procedure instructions.

FOLLOW-UP:
Return to clinic in [2-4] weeks to assess response.`
  },
  {
    id: "facet-injection",
    name: "Lumbar Facet Joint Injection",
    category: "Procedures",
    cptCode: "64490",
    description: "Complete procedure note for facet joint injection",
    template: `PROCEDURE NOTE

PROCEDURE: Lumbar Facet Joint Injection, [Left/Right/Bilateral] [L3-4, L4-5, L5-S1]
DATE: [Date]
PHYSICIAN: [Provider name]

PREOPERATIVE DIAGNOSIS:
Lumbar facet arthropathy, [laterality] [levels]

POSTOPERATIVE DIAGNOSIS: Same

INDICATION/MEDICAL NECESSITY:
Patient presents with axial low back pain consistent with facet-mediated pain. Clinical features include: paraspinal tenderness, pain with extension and rotation, absence of radicular symptoms. Has failed [conservative treatments]. [If diagnostic: This injection is being performed to confirm facet joints as pain generator. / If therapeutic: Previous diagnostic blocks provided >50% relief confirming facet-mediated pain.]

CONSENT:
Informed consent obtained. Risks discussed including infection, bleeding, nerve injury, allergic reaction, and lack of relief. Patient wishes to proceed.

PROCEDURE DETAILS:
Patient positioned prone. Fluoroscopic guidance used throughout. [Left/Right/Bilateral] [levels] facet joints identified. Skin prepped and draped in sterile fashion.

Local anesthesia: 1% lidocaine to skin and subcutaneous tissue.

[For each level]:
[L_-_] facet joint: [22/25]-gauge spinal needle advanced under fluoroscopic guidance into the joint space. Intra-articular position confirmed by [contrast spread/needle position on AP and lateral views]. Injected [0.5-1] mL of [medication mixture].

Total injectate per joint: [X] mg [steroid] + [X] mL [local anesthetic]

FLUOROSCOPY TIME: [X] minutes
ESTIMATED BLOOD LOSS: Minimal
COMPLICATIONS: None

DISPOSITION:
Patient tolerated procedure well without immediate complications. Monitored and discharged in stable condition with instructions.

FOLLOW-UP:
Pain diary provided. Return in [2-4] weeks for assessment of response.`
  },
  {
    id: "rfa-lumbar",
    name: "Lumbar Radiofrequency Ablation",
    category: "Procedures",
    cptCode: "64635",
    description: "Complete procedure note for lumbar medial branch RFA",
    template: `PROCEDURE NOTE

PROCEDURE: Radiofrequency Ablation of Lumbar Medial Branches, [Left/Right/Bilateral] [levels]
DATE: [Date]
PHYSICIAN: [Provider name]

PREOPERATIVE DIAGNOSIS:
Lumbar facet syndrome, [laterality], [levels] - confirmed by positive diagnostic medial branch blocks

POSTOPERATIVE DIAGNOSIS: Same

INDICATION/MEDICAL NECESSITY:
Patient has lumbar facet-mediated pain confirmed by [two] positive diagnostic medial branch blocks with [>50%/80%] pain relief lasting [duration]. This meets criteria for therapeutic radiofrequency ablation per [Medicare LCD/payer guidelines].

Diagnostic block dates and results:
- Block #1: [Date] - [X]% relief for [duration]
- Block #2: [Date] - [X]% relief for [duration]

CONSENT:
Informed consent obtained after discussion of risks, benefits, and alternatives including: infection, bleeding, nerve injury, neuritis, skin burn, and incomplete pain relief. Patient wishes to proceed.

PROCEDURE DETAILS:
Patient placed prone. Standard monitors applied. Fluoroscopic guidance used throughout. Sterile prep and drape.

Targets: [List medial branches, e.g., L3, L4, L5 medial branches and L5 dorsal ramus bilaterally]

Technique:
[For each level, document]:
[Level] medial branch: [20/22]-gauge RF cannula with [10]mm active tip positioned at junction of transverse process and superior articular process under fluoroscopic guidance. Sensory stimulation at 50Hz up to [0.5]V produced concordant paraspinal sensation. Motor stimulation at 2Hz up to [1.0]V produced no lower extremity fasciculations. After negative aspiration, [1-2] mL of 2% lidocaine injected. Lesion created at [80]\u00B0C for [90] seconds.

[Repeat documentation for each level treated]

FLUOROSCOPY TIME: [X] minutes
ESTIMATED BLOOD LOSS: Minimal
COMPLICATIONS: None

DISPOSITION:
Patient tolerated procedure well. No immediate complications. Post-procedure instructions provided including activity restrictions for 24-48 hours. May experience increased soreness for 1-2 weeks.

FOLLOW-UP:
Return in [6-8] weeks for assessment. Full effect expected by [6-8] weeks post-procedure.`
  },
  {
    id: "joint-injection",
    name: "Large Joint Injection",
    category: "Procedures",
    cptCode: "20610",
    description: "Template for knee, shoulder, or hip injection",
    template: `PROCEDURE NOTE

PROCEDURE: [Left/Right] [Knee/Shoulder/Hip] Joint Injection
DATE: [Date]
PHYSICIAN: [Provider name]

PREOPERATIVE DIAGNOSIS:
[Left/Right] [knee/shoulder/hip] [osteoarthritis/bursitis/tendinitis/synovitis]

POSTOPERATIVE DIAGNOSIS: Same

INDICATION/MEDICAL NECESSITY:
Patient presents with [left/right] [joint] pain due to [diagnosis]. Symptoms include [pain, swelling, decreased ROM]. Has failed conservative measures including [rest, ice, NSAIDs, PT]. Injection indicated for therapeutic relief.

CONSENT:
Risks, benefits, and alternatives discussed including infection, bleeding, tendon weakening (if applicable), allergic reaction, and temporary worsening. Patient consents to proceed.

PROCEDURE DETAILS:
Patient positioned [supine/seated/lateral]. [Left/Right] [joint] identified by palpation [and/or ultrasound guidance]. Skin prepped with chlorhexidine and draped.

[Landmark/Ultrasound-guided] approach: [Describe approach, e.g., "superolateral approach to knee joint"]

[22/25]-gauge needle inserted into joint space. [Aspiration attempted - X mL of (serous/hemorrhagic/purulent) fluid obtained / No effusion present].

Injected: [40-80]mg [methylprednisolone/triamcinolone] + [X] mL [1% lidocaine/0.25% bupivacaine]

Needle removed. Pressure applied. Sterile bandage placed.

COMPLICATIONS: None

DISPOSITION:
Patient tolerated procedure well. Instructed to rest joint for 24-48 hours, ice as needed, and avoid strenuous activity for [X] days.

FOLLOW-UP:
Return PRN or in [4-6] weeks if symptoms persist.`
  }
];

export function buildCodeSuggestionPrompt(note) {
  return `Analyze this clinical note and suggest appropriate CPT and ICD-10 codes:

CLINICAL NOTE:
${note}

Suggest the most appropriate billing codes based on what is documented.`;
}

export function buildAddendumPrompt(note, gaps) {
  return `Generate a compliant addendum to address the following documentation gaps:

ORIGINAL CLINICAL NOTE:
${note}

IDENTIFIED GAPS TO ADDRESS:
${gaps.map((g, i) => `${i + 1}. ${g}`).join('\n')}

Generate an addendum that addresses these specific gaps while maintaining clinical accuracy.`;
}
