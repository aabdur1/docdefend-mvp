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

## Summary

| Phase | Environment | Data Type | API Used |
|-------|-------------|-----------|----------|
| **Current (Demo)** | Local development | Synthetic only | Anthropic API |
| **Testing** | AWS (Bedrock) | De-identified or synthetic | AWS Bedrock |
| **Production** | AWS (Bedrock + full security) | Real PHI | AWS Bedrock |

**Key Takeaway:** The transition from demo to production requires:
1. Signing a BAA with AWS
2. Deploying infrastructure within AWS
3. Switching from Anthropic SDK to AWS Bedrock SDK
4. Implementing comprehensive security controls

The code changes are minimal, but the infrastructure and compliance setup is critical.

---

*Document prepared for DocDefend MVP - IDS594*
*Last updated: February 2025*
