When discussing HIPAA, compliance, PHI, data security, or AWS migration:

- Read `HIPAA_COMPLIANCE.md` for the full 3-phase strategy
- Phase 1 (current): Demo mode, synthetic data only, no legal requirements
- Phase 2 (next): De-identified data validation pilot. NO infrastructure changes needed. Practice staff de-identifies, we process through existing Anthropic API.
- Phase 3 (future): Real PHI via AWS Bedrock. Requires BAA, VPC, IAM, CloudTrail, KMS, WAF. Triggered when VC funding secured + 10-20 providers ready.
- **Never use real patient data** in the current system
- De-identified data is NOT PHI under HIPAA (Safe Harbor method, 18 identifiers stripped)
- The chicken-and-egg problem: hospitals won't share data without HIPAA compliance, but compliance costs money we don't have yet. VC funding breaks this deadlock.
