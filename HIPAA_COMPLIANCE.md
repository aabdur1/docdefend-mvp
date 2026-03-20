# HIPAA Compliance Strategy for DocDefend

> This document outlines the considerations and implementation strategy for ensuring HIPAA compliance when handling Protected Health Information (PHI) in the DocDefend application.

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [HIPAA Concerns](#hipaa-concerns)
3. [Compliance Options](#compliance-options)
4. [Recommended Solution: AWS Bedrock](#recommended-solution-aws-bedrock)
5. [Implementation Guide](#implementation-guide)
6. [Cost Analysis](#cost-analysis)
7. [Security Checklist](#security-checklist)

---

## Current Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│    Client    │────▶│    Server    │────▶│   Anthropic API      │
│   (React)    │     │  (Node.js)   │     │ (api.anthropic.com)  │
└──────────────┘     └──────────────┘     └──────────────────────┘
     Browser              Local              Third-Party Cloud
```

**Current State:** Demo/development mode using synthetic patient data only.

**Risk if used with real PHI:** Clinical notes containing patient information would be transmitted to Anthropic's public API, which does not include a Business Associate Agreement (BAA) under standard terms.

---

## HIPAA Concerns

### What is PHI?

Protected Health Information includes any individually identifiable health information:

| PHI Element | Example |
|-------------|---------|
| Patient names | "John Smith" |
| Dates (birth, admission, discharge) | "DOB: 03/15/1985" |
| Medical record numbers | "MRN: 12345678" |
| Social Security numbers | "SSN: XXX-XX-XXXX" |
| Diagnoses and conditions | "Type 2 Diabetes" |
| Treatment information | "Started on Metformin 500mg" |
| Provider names | "Dr. Jane Doe" |

### Compliance Requirements

1. **Business Associate Agreement (BAA)** - Required with any third party that handles PHI
2. **Encryption in Transit** - TLS 1.2+ for all data transmission
3. **Encryption at Rest** - PHI must be encrypted when stored
4. **Access Controls** - Role-based access to PHI
5. **Audit Logging** - Track all access to PHI
6. **Minimum Necessary** - Only access PHI needed for the task

### Penalties for Non-Compliance

| Violation Level | Penalty Range |
|-----------------|---------------|
| Unknowing | $100 - $50,000 per violation |
| Reasonable Cause | $1,000 - $50,000 per violation |
| Willful Neglect (Corrected) | $10,000 - $50,000 per violation |
| Willful Neglect (Not Corrected) | $50,000+ per violation |

*Annual maximum: $1.5 million per violation category*

---

## Compliance Options

| Option | Description | BAA Available | Complexity | Cost |
|--------|-------------|---------------|------------|------|
| **AWS Bedrock** | Claude models within AWS infrastructure | Yes | Medium | $$ |
| **Anthropic Enterprise** | Direct enterprise agreement with Anthropic | Yes | Low | $$$ |
| **Azure AI (Claude)** | Claude via Azure partnership | Yes | Medium | $$ |
| **De-identification** | Strip PHI before API calls | N/A | High | $ |
| **On-Premise LLM** | Self-hosted open-source models | N/A | Very High | $$$$ |

### Recommendation

**AWS Bedrock** is the recommended solution for DocDefend because:

- HIPAA-eligible service with BAA
- Same Claude models we currently use
- Pay-per-use pricing suitable for small clinics
- Comprehensive security controls
- Audit logging built-in
- Data never leaves your AWS environment

---

## Recommended Solution: AWS Bedrock

### Architecture with Bedrock

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         AWS Account (HIPAA BAA Signed)                  │
│                                                                         │
│  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────────┐   │
│  │   Client    │    │  Server (ECS/   │    │     AWS Bedrock       │   │
│  │  (React +   │───▶│  Lambda/EC2)    │───▶│   Claude Sonnet 3.5   │   │
│  │  CloudFront)│    │                 │    │                       │   │
│  └─────────────┘    └─────────────────┘    └───────────────────────┘   │
│        │                    │                         │                 │
│        │                    │                         │                 │
│        ▼                    ▼                         ▼                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────────┐   │
│  │     WAF     │    │   VPC Private   │    │    CloudWatch Logs    │   │
│  │  (Firewall) │    │     Subnet      │    │    (Audit Trail)      │   │
│  └─────────────┘    └─────────────────┘    └───────────────────────┘   │
│                                                                         │
│                    Data Never Leaves AWS Environment                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Security Features

| Feature | Description |
|---------|-------------|
| **VPC Isolation** | Server runs in private subnet with no public internet access |
| **IAM Roles** | No API keys; uses AWS IAM for authentication |
| **KMS Encryption** | Customer-managed keys for encryption at rest |
| **CloudTrail** | Complete audit log of all API calls |
| **VPC Endpoints** | Private connectivity to Bedrock (no public internet) |
| **WAF** | Web Application Firewall for DDoS and injection protection |

---

## Implementation Guide

### Step 1: AWS Account Setup

```bash
# Install AWS CLI
brew install awscli

# Configure credentials
aws configure
```

### Step 2: Sign the BAA

1. Log into AWS Console
2. Navigate to **AWS Artifact**
3. Find "Business Associate Addendum"
4. Review and accept the agreement

### Step 3: Enable Bedrock

1. Go to **Amazon Bedrock** in AWS Console
2. Click **Model access**
3. Request access to **Anthropic Claude** models
4. Wait for approval (usually instant)

### Step 4: Create IAM Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-*"
    }
  ]
}
```

### Step 5: Code Changes

**Install AWS SDK:**

```bash
npm install @aws-sdk/client-bedrock-runtime
```

**Update server code:**

```javascript
// Before: Direct Anthropic API
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const response = await client.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 4096,
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }]
});

const result = response.content[0].text;
```

```javascript
// After: AWS Bedrock
import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({
  region: 'us-east-1'
});

const response = await client.send(new InvokeModelCommand({
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  contentType: 'application/json',
  body: JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }]
  })
}));

const result = JSON.parse(
  new TextDecoder().decode(response.body)
).content[0].text;
```

### Step 6: Deploy to AWS

Options for deployment:

| Service | Best For | Scaling |
|---------|----------|---------|
| **AWS Lambda** | Low traffic, cost optimization | Automatic |
| **ECS Fargate** | Medium traffic, containerized | Automatic |
| **EC2** | High traffic, full control | Manual/ASG |

---

## Cost Analysis

### Model Pricing (Same for Anthropic API and Bedrock)

| Model | Input (per 1M tokens) | Output (per 1M tokens) |
|-------|----------------------|------------------------|
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

### Estimated Monthly Costs

**Scenario: Small clinic, 100 analyses/day**

| Component | Estimated Cost |
|-----------|----------------|
| Bedrock (Claude Sonnet) | ~$50-100/month |
| Lambda (compute) | ~$5-10/month |
| CloudWatch (logging) | ~$5/month |
| Data transfer | ~$2/month |
| **Total** | **~$62-117/month** |

### Cost Optimization Tips

1. Use **Claude 3 Haiku** for code suggestions (cheaper, still effective)
2. Use **Claude 3.5 Sonnet** only for main analysis
3. Implement **caching** for repeated analyses
4. Set up **budget alerts** in AWS

---

## Security Checklist

### Before Going Live with PHI

- [ ] **BAA signed** with AWS in AWS Artifact
- [ ] **HIPAA-eligible services only** - Verify all services used are HIPAA-eligible
- [ ] **VPC configured** with private subnets
- [ ] **VPC endpoints** for Bedrock (no public internet)
- [ ] **IAM roles** with least-privilege access
- [ ] **CloudTrail enabled** for audit logging
- [ ] **CloudWatch Logs** with appropriate retention
- [ ] **KMS encryption** for any stored data
- [ ] **WAF configured** for web application protection
- [ ] **SSL/TLS certificates** for all endpoints
- [ ] **Security groups** properly configured
- [ ] **No PHI in logs** - Ensure clinical notes aren't logged
- [ ] **Access controls** - Role-based access implemented
- [ ] **Incident response plan** documented
- [ ] **Staff training** on HIPAA requirements

### Ongoing Compliance

- [ ] Regular security assessments
- [ ] Penetration testing (annual)
- [ ] Access reviews (quarterly)
- [ ] Audit log reviews (monthly)
- [ ] Software updates and patching
- [ ] Employee HIPAA training (annual)

---

## Additional Resources

- [AWS HIPAA Compliance](https://aws.amazon.com/compliance/hipaa-compliance/)
- [AWS HIPAA Eligible Services](https://aws.amazon.com/compliance/hipaa-eligible-services-reference/)
- [Amazon Bedrock Security](https://docs.aws.amazon.com/bedrock/latest/userguide/security.html)
- [HHS HIPAA Guidance](https://www.hhs.gov/hipaa/index.html)
- [Anthropic Enterprise](https://www.anthropic.com/enterprise)

---

## Phase 2: Validation Pilot with De-Identified Data

> **This phase does NOT require AWS Bedrock.** De-identified data is not PHI under HIPAA, so it can legally be processed through the current Anthropic API. This is the fastest path to validating DocDefend's accuracy with real clinical data.

### Why De-Identification First?

Per Shivani Singh (Harvard MBA, founder of t0.ai): DocDefend needs to verify its results with actual patient data and get 10-20 providers to use it before it's VC-fundable. De-identified data achieves validation without the cost and complexity of full HIPAA infrastructure.

### The 18 HIPAA Identifiers to Remove

The practice's staff must strip ALL of the following before sharing notes with DocDefend:

| # | Identifier | Example | Replace With |
|---|-----------|---------|--------------|
| 1 | Names | "Jane Smith" | "[PATIENT]" |
| 2 | Geographic data (smaller than state) | "123 Main St, Dallas TX 75201" | "[ADDRESS]" |
| 3 | Dates (except year) | "DOB: 03/15/1972" | "DOB: [REDACTED]/1972" or age |
| 4 | Phone numbers | "(214) 555-1234" | "[PHONE]" |
| 5 | Fax numbers | "(214) 555-5678" | "[FAX]" |
| 6 | Email addresses | "jane@email.com" | "[EMAIL]" |
| 7 | Social Security numbers | "123-45-6789" | "[SSN]" |
| 8 | Medical record numbers | "MRN: 12345678" | "[MRN]" |
| 9 | Health plan beneficiary numbers | "BCBS ID: ABC123" | "[PLAN_ID]" |
| 10 | Account numbers | "Acct: 98765" | "[ACCOUNT]" |
| 11 | Certificate/license numbers | "DEA: AB1234567" | "[LICENSE]" |
| 12 | Vehicle identifiers | "License plate ABC-1234" | "[VEHICLE]" |
| 13 | Device identifiers | "Pacemaker SN: 12345" | "[DEVICE]" |
| 14 | Web URLs | "patient portal link" | "[URL]" |
| 15 | IP addresses | N/A for clinical notes | "[IP]" |
| 16 | Biometric identifiers | Fingerprints, voiceprints | "[BIOMETRIC]" |
| 17 | Full-face photographs | Photos | Remove entirely |
| 18 | Any other unique identifier | Custom IDs | "[ID]" |

**What stays in the note:** All clinical content — diagnoses, symptoms, medications, exam findings, procedures, treatment plans. This is what DocDefend analyzes. The defensibility scoring works identically without identifiers.

### De-Identified Note Example

**Before (PHI):**
```
Jane Smith (DOB: 03/15/1972, MRN: 12345678) is a 54-year-old female
presenting for follow-up of Type 2 diabetes with hyperglycemia and
hypertension. Patient seen at Dallas Family Medicine, 123 Main St.
Dr. Sarah Johnson, NPI: 1234567890.
```

**After (de-identified, safe to process):**
```
[PATIENT] is a 54-year-old female presenting for follow-up of
Type 2 diabetes with hyperglycemia and hypertension. Patient seen
at [PRACTICE]. [PROVIDER].
```

### Pilot Design

**Target:** 50-100 de-identified notes with known claim outcomes from a single family medicine practice.

**Data needed from the practice (per note):**

| Field | Purpose |
|-------|---------|
| De-identified clinical note | Input to DocDefend |
| CPT codes actually billed | Compare against DocDefend's suggestions |
| ICD-10 codes actually billed | Compare against DocDefend's suggestions |
| Payer (Medicare/UHC/Aetna/BCBS/Cigna) | Enable payer-specific analysis |
| Claim outcome (paid/denied/downcoded) | Ground truth for validation |
| If denied: denial reason code (CARC) | Validate gap analysis accuracy |
| If downcoded: original vs. paid E/M level | Validate downcode prediction |
| Reimbursement amount | Validate financial impact estimates |

**What to measure:**

| Metric | How | Target |
|--------|-----|--------|
| **Defensibility score accuracy** | Do HIGH scores correlate with paid claims? LOW with denials? | >80% correlation |
| **E/M level accuracy** | Does DocDefend's recommended level match what was paid? | >85% match |
| **Downcode prediction** | Did the downcoding risk engine flag claims that were actually downcoded? | >70% recall |
| **Code suggestion accuracy** | Do AI-suggested codes match what was actually billed and paid? | >75% overlap |
| **False positive rate** | How often does DocDefend flag problems that weren't real? | <20% |
| **Actionability** | Would the fix suggestions have prevented the denial? (provider review) | Qualitative |

### Legal Requirements for De-Identified Data Pilot

| Requirement | Needed? | Notes |
|-------------|---------|-------|
| BAA with AWS | **No** | De-identified data is not PHI |
| BAA with the practice | **No** | You never access PHI — practice staff does the de-identification |
| AWS Bedrock migration | **No** | Current Anthropic API is fine for non-PHI |
| Patient consent | **No** | De-identified data falls outside HIPAA's consent requirements |
| Data Use Agreement | **Recommended** | Simple written agreement with the practice covering: what data is shared, how it's used, how it's stored, when it's deleted |
| IRB approval | **No** | This is quality improvement / product validation, not academic research (unless UIC requires it for IDS 594 — check with professor) |

### Validation Partner Options

Listed in order of strength of evidence:

| Option | Data Source | Outcomes Available? | Dependency | Timeline |
|--------|-----------|-------------------|------------|----------|
| **UIC College of Medicine physician** | De-identified notes from UIC clinical faculty | Yes — real claim outcomes | Prof. Brad Sturt introduction + physician agreement | Weeks |
| **Dr. Abdurrahim's practice (Dallas)** | De-identified notes from FM practice | Yes — real claim outcomes | Aunt's agreement + staff time for de-identification | Weeks |
| **MTSamples + hired CPC coder** | Public de-identified notes + expert grading | No real outcomes, but expert validation of methodology | Upwork hire (~$500-1,000) | Days |
| **CMS public utilization data** | Medicare payment data by provider/code | Payment patterns only (no notes) | None — publicly available | Immediate |
| **AAPC practice exam vignettes** | Clinical scenarios with known correct codes | "Answer key" codes, not real outcomes | AAPC membership or prep materials | Immediate |

**Recommended approach:** Pursue UIC faculty connection (strongest evidence) while simultaneously running MTSamples + CPC coder validation (no dependencies, immediate start). Use the independent validation results when reaching out to potential clinical partners — showing existing accuracy data makes it easier for a physician to say yes.

**Next step:** Email Prof. Brad Sturt (IDS 594) to ask for a connection to UIC College of Medicine faculty and clarification on whether a de-identified data study requires IRB.

### Pilot Workflow

```
Practice/physician staff                DocDefend team
────────────────────────                ──────────────
1. Pull 50-100 recent notes
   with known outcomes
2. De-identify (strip 18 identifiers)
3. Record claim outcomes in
   a spreadsheet (paid/denied/
   downcoded, amounts, codes)
4. Share de-identified notes ──────────► 5. Run through DocDefend
   + outcomes spreadsheet                  (current MVP, no changes needed)
   (secure transfer — encrypted        6. Compare DocDefend scores
    email or shared drive)                 vs actual outcomes
                                       7. Calculate accuracy metrics
                                       8. Document results for
                                          investor pitch / WPU
```

### Secure Data Transfer

Even though de-identified data is not PHI, treat it with care:

- **Do:** Use encrypted email (Gmail confidential mode), secure shared drive (Google Drive with restricted access), or encrypted USB
- **Don't:** Send via unencrypted email, Slack, or public file sharing
- **After validation:** Delete the de-identified notes from your systems. Keep only aggregate results (accuracy metrics, not individual notes)

---

## Phase 3: Production with Real PHI (Future)

> **This phase requires AWS Bedrock, BAA, and full security controls.** Only pursue after validation pilot proves accuracy and 10-20 providers express willingness to pay.

### Additional Legal Requirements (Beyond Phase 2)

| Requirement | Details |
|-------------|---------|
| **BAA with AWS** | Sign in AWS Artifact (5 minutes, free) |
| **BAA with each practice** | DocDefend becomes a Business Associate. Need a BAA template — have a healthcare attorney draft one or use a standard HIPAA BAA template. |
| **HIPAA Security Risk Assessment** | HHS requires covered entities and BAs to conduct a risk assessment. Use the [HHS SRA Tool](https://www.healthit.gov/topic/privacy-security-and-hipaa/security-risk-assessment-tool) (free). |
| **HIPAA Privacy Policies** | Written policies for how DocDefend handles PHI — access, storage, breach notification, disposal. |
| **Breach Notification Plan** | Documented plan for notifying affected individuals and HHS within 60 days of a breach. |
| **Business entity** | You need a legal entity (LLC or Corp) to sign BAAs. Cannot sign as individuals. |
| **Cyber liability insurance** | Recommended — covers breach costs. ~$500-2,000/year for a startup. |

### When to Migrate to Bedrock

Trigger: Validation pilot is complete, accuracy is proven, and you have 10+ providers ready to use DocDefend with real patient data. At that point, follow the AWS Bedrock implementation guide above (Steps 1-6).

---

## Summary

| Phase | Environment | Data Type | API Used | Legal Needs |
|-------|-------------|-----------|----------|-------------|
| **Phase 1 (Current — Demo)** | Vercel + Render | Synthetic only | Anthropic API | None |
| **Phase 2 (Validation Pilot)** | Vercel + Render (no changes) | De-identified real notes | Anthropic API | Data Use Agreement (recommended) |
| **Phase 3 (Production)** | AWS (Bedrock + full security) | Real PHI | AWS Bedrock | BAA, risk assessment, policies, insurance |

**Key Insight:** Phase 2 is achievable NOW with zero infrastructure changes. The practice handles de-identification, DocDefend processes the notes through the existing MVP, and the team measures accuracy against known outcomes. This is the fastest path to the validation that Shivani Singh identified as a VC-funding prerequisite.

---

*Document prepared for DocDefend MVP - IDS594*
*Last updated: March 2026*
