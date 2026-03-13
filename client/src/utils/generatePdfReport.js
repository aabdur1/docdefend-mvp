/**
 * Generates a formatted, text-based PDF report from the analysis data.
 * Opens in a new window with print dialog — user saves as PDF via browser.
 * Uses Blob URL (no document.write) for safe rendering.
 */

const PAYER_NAMES = {
  medicare: 'Medicare (CMS)',
  united: 'United Healthcare',
  aetna: 'Aetna',
  bcbs: 'Blue Cross Blue Shield',
};

const STATUS_LABELS = {
  SUPPORTED: 'Supported',
  PARTIALLY_SUPPORTED: 'Partially Supported',
  NOT_SUPPORTED: 'Not Supported',
};

const SCORE_LABELS = {
  HIGH: 'High Defensibility',
  MEDIUM: 'Needs Improvement',
  LOW: 'Significant Gaps',
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildCodeAnalysisSection(codeAnalysis) {
  if (!codeAnalysis?.length) return '';

  return codeAnalysis.map((analysis) => {
    const statusClass = {
      SUPPORTED: 'status-supported',
      PARTIALLY_SUPPORTED: 'status-partial',
      NOT_SUPPORTED: 'status-not-supported',
    }[analysis.status] || 'status-partial';

    const supporting = (analysis.supportingElements || [])
      .map(el => `<li class="list-check">${escapeHtml(el)}</li>`)
      .join('');

    const missing = (analysis.missingElements || [])
      .map(el => `<li class="list-x">${escapeHtml(el)}</li>`)
      .join('');

    const fixes = (analysis.fixSuggestions || [])
      .map(el => `<li class="list-arrow">${escapeHtml(el)}</li>`)
      .join('');

    return `
      <div class="code-card">
        <div class="code-header">
          <span class="code-label">${escapeHtml(analysis.code)}</span>
          <span class="code-desc">${escapeHtml(analysis.codeDescription)}</span>
          <span class="status-badge ${statusClass}">${STATUS_LABELS[analysis.status] || analysis.status}</span>
        </div>
        ${supporting ? `
          <div class="findings-block findings-supported">
            <h4>Supporting Elements Found</h4>
            <ul>${supporting}</ul>
          </div>
        ` : ''}
        ${missing ? `
          <div class="findings-block findings-missing">
            <h4>Missing Elements</h4>
            <ul>${missing}</ul>
          </div>
        ` : ''}
        ${fixes ? `
          <div class="findings-block findings-fixes">
            <h4>Suggested Fixes</h4>
            <ul>${fixes}</ul>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function buildEMLevelSection(em, selectedCptCodes) {
  if (!em) return '';

  const selectedEM = selectedCptCodes?.find(c => /^99\d{3}$/.test(c)) || 'None';
  const compLabel = {
    MATCH: 'Correct Level',
    UNDERCODED: 'Undercoded',
    OVERCODED: 'Overcoded',
    'N/A': 'N/A',
  }[em.comparedToSelected] || 'N/A';

  const compClass = {
    MATCH: 'comp-match',
    UNDERCODED: 'comp-under',
    OVERCODED: 'comp-over',
  }[em.comparedToSelected] || '';

  let mdmRows = '';
  if (em.mdmDetails && em.methodology === 'MDM') {
    mdmRows = `
      <table class="mdm-table">
        <thead>
          <tr><th scope="col">MDM Component</th><th scope="col">Level</th></tr>
        </thead>
        <tbody>
          <tr><td>Problem Complexity</td><td>${escapeHtml(em.mdmDetails.problemComplexity)}</td></tr>
          <tr><td>Data Complexity</td><td>${escapeHtml(em.mdmDetails.dataComplexity)}</td></tr>
          <tr><td>Risk of Complications</td><td>${escapeHtml(em.mdmDetails.riskLevel)}</td></tr>
        </tbody>
      </table>
    `;
  }

  return `
    <div class="section">
      <h2>E/M Level Recommendation</h2>
      <p class="section-subtitle">Based on ${em.methodology === 'TIME' ? 'time-based' : 'MDM-based'} evaluation</p>
      <div class="em-comparison">
        <div class="em-box">
          <span class="em-label">Selected</span>
          <span class="em-value">${escapeHtml(selectedEM)}</span>
        </div>
        <span class="em-arrow">&rarr;</span>
        <div class="em-box em-box-recommended">
          <span class="em-label">Documented Level</span>
          <span class="em-value">${escapeHtml(em.documentedLevel)}</span>
          <span class="em-desc">${escapeHtml(em.documentedLevelDescription)}</span>
        </div>
        <span class="comp-badge ${compClass}">${compLabel}</span>
      </div>
      ${mdmRows}
      ${em.rationale ? `<p class="rationale">${escapeHtml(em.rationale)}</p>` : ''}
      ${em.revenueImpact && em.comparedToSelected !== 'MATCH' && em.comparedToSelected !== 'N/A' ? `<p class="revenue-impact">${escapeHtml(em.revenueImpact)}</p>` : ''}
    </div>
  `;
}

function buildFinancialSection(fi, selectedPayer) {
  if (!fi) return '';

  const payerName = PAYER_NAMES[selectedPayer] || 'Medicare (CMS)';

  let breakdownRows = '';
  if (fi.breakdown?.length) {
    breakdownRows = fi.breakdown.map(item => `
      <tr>
        <td class="code-cell">${escapeHtml(item.code)}</td>
        <td>${escapeHtml(item.reason)}</td>
        <td class="num-cell">${escapeHtml(item.estimatedReimbursement)}</td>
        <td class="num-cell risk-cell">${item.atRisk && item.atRisk !== '$0' ? escapeHtml(item.atRisk) : '\u2014'}</td>
      </tr>
    `).join('');
  }

  return `
    <div class="section">
      <h2>Financial Impact</h2>
      <p class="section-subtitle">Estimated ${escapeHtml(payerName)} reimbursement</p>
      <div class="financial-grid">
        <div class="fin-metric">
          <span class="fin-label">Total Claim Value</span>
          <span class="fin-value">${escapeHtml(fi.totalClaimValue || '$0')}</span>
        </div>
        <div class="fin-metric fin-metric-risk">
          <span class="fin-label">At Risk</span>
          <span class="fin-value">${escapeHtml(fi.atRiskAmount || '$0')}</span>
        </div>
        <div class="fin-metric fin-metric-recovery">
          <span class="fin-label">Potential Recovery</span>
          <span class="fin-value">${escapeHtml(fi.potentialRecovery || '$0')}</span>
        </div>
      </div>
      ${breakdownRows ? `
        <table class="breakdown-table">
          <thead>
            <tr><th scope="col">Code</th><th scope="col">Assessment</th><th scope="col">Reimbursement</th><th scope="col">At Risk</th></tr>
          </thead>
          <tbody>${breakdownRows}</tbody>
        </table>
      ` : ''}
    </div>
  `;
}

function buildPayerSection(findings, payerName) {
  if (!findings?.length) return '';

  const statusLabel = { MET: 'Met', PARTIALLY_MET: 'Partial', NOT_MET: 'Not Met' };
  const statusClass = { MET: 'pf-met', PARTIALLY_MET: 'pf-partial', NOT_MET: 'pf-not-met' };

  const rows = findings.map(f => `
    <tr>
      <td class="${statusClass[f.status] || 'pf-not-met'}">${statusLabel[f.status] || 'Not Met'}</td>
      <td><strong>${escapeHtml(f.rule)}</strong><br><span class="detail-text">${escapeHtml(f.detail)}</span>
        ${f.status !== 'MET' && f.impact ? `<br><span class="impact-text">${escapeHtml(f.impact)}</span>` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <div class="section">
      <h2>Payer-Specific Requirements</h2>
      <p class="section-subtitle">${escapeHtml(payerName)} rules beyond Medicare baseline</p>
      <table class="payer-table">
        <thead><tr><th scope="col" style="width:90px">Status</th><th scope="col">Requirement</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function buildRecommendationsSection(recs) {
  if (!recs?.length) return '';

  const items = recs.map((rec, i) => `
    <li><span class="rec-num">${i + 1}</span>${escapeHtml(rec)}</li>
  `).join('');

  return `
    <div class="section">
      <h2>General Recommendations</h2>
      <ol class="rec-list">${items}</ol>
    </div>
  `;
}

export default function generatePdfReport({ report, selectedCptCodes, selectedPayer }) {
  if (!report) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const payerName = report.payerName || PAYER_NAMES[selectedPayer] || 'Medicare (CMS)';

  const scoreLabel = SCORE_LABELS[report.overallScore] || 'Analysis Complete';
  const scoreClass = {
    HIGH: 'score-high',
    MEDIUM: 'score-medium',
    LOW: 'score-low',
  }[report.overallScore] || 'score-medium';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>DocDefend+ Defensibility Report \u2014 ${escapeHtml(dateStr)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --green: #1B4332;
      --green-light: #d1fae5;
      --green-mid: #065f46;
      --red: #dc2626;
      --red-light: #fef2f2;
      --amber: #d97706;
      --amber-light: #fffbeb;
      --blue: #2563eb;
      --blue-light: #eff6ff;
      --parchment: #FAF6EF;
      --parchment-card: #F5EFE0;
      --border: #D6C9A8;
      --text: #1e293b;
      --text-muted: #64748b;
      --font-display: 'DM Serif Display', Georgia, serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
      --font-mono: 'IBM Plex Mono', monospace;
    }

    @page {
      size: letter;
      margin: 0.65in 0.75in;
    }

    body {
      font-family: var(--font-body);
      font-size: 10.5pt;
      line-height: 1.55;
      color: var(--text);
      background: white;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      padding: 40px;
      max-width: 850px;
      margin: 0 auto;
    }

    /* Letterhead */
    .letterhead {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      border-bottom: 3px solid var(--green);
      padding-bottom: 12px;
      margin-bottom: 24px;
    }
    .letterhead-left h1 {
      font-family: var(--font-display);
      font-size: 22pt;
      color: var(--green);
      letter-spacing: -0.02em;
      line-height: 1.1;
    }
    .letterhead-left h1 .plus { color: var(--red); font-size: 14pt; vertical-align: super; }
    .letterhead-left .tagline {
      font-size: 8pt;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .letterhead-right {
      text-align: right;
      font-size: 8.5pt;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Score Banner */
    .score-banner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 24px;
      border: 1.5px solid var(--border);
      background: var(--parchment-card);
    }
    .score-indicator {
      width: 56px; height: 56px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: var(--font-mono);
      font-weight: 700; font-size: 14pt;
      color: white; flex-shrink: 0;
    }
    .score-high .score-indicator { background: var(--green); }
    .score-medium .score-indicator { background: var(--amber); }
    .score-low .score-indicator { background: var(--red); }
    .score-text h2 { font-family: var(--font-display); font-size: 16pt; margin-bottom: 2px; }
    .score-text p { font-size: 9.5pt; color: var(--text-muted); }
    .score-label {
      margin-left: auto;
      font-size: 9pt; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.08em;
      padding: 4px 12px; border-radius: 999px;
    }
    .score-high .score-label { background: var(--green-light); color: var(--green-mid); }
    .score-medium .score-label { background: var(--amber-light); color: var(--amber); }
    .score-low .score-label { background: var(--red-light); color: var(--red); }

    /* Sections */
    .section { margin-bottom: 22px; page-break-inside: avoid; }
    .section h2 {
      font-family: var(--font-display);
      font-size: 13pt; color: var(--green);
      border-bottom: 1px solid var(--border);
      padding-bottom: 6px; margin-bottom: 10px;
    }
    .section-subtitle {
      font-size: 8.5pt; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--text-muted);
      margin-top: -6px; margin-bottom: 12px;
    }

    /* Risk Summary */
    .risk-summary {
      background: var(--parchment-card);
      border: 1px solid var(--border);
      border-left: 4px solid var(--amber);
      border-radius: 6px;
      padding: 14px 16px;
      margin-bottom: 22px;
      font-size: 10pt; line-height: 1.6;
    }
    .risk-summary strong {
      display: block; font-size: 8pt;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--amber); margin-bottom: 4px;
    }

    /* E/M Level */
    .em-comparison {
      display: flex; align-items: center;
      gap: 12px; margin-bottom: 14px; flex-wrap: wrap;
    }
    .em-box {
      flex: 1; min-width: 120px; text-align: center;
      padding: 10px 14px; border: 1px solid var(--border);
      border-radius: 6px; background: var(--parchment);
    }
    .em-box-recommended { border: 2px solid var(--green); background: var(--green-light); }
    .em-label { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 2px; }
    .em-value { display: block; font-family: var(--font-mono); font-size: 16pt; font-weight: 700; color: var(--green); }
    .em-desc { display: block; font-size: 8pt; color: var(--text-muted); }
    .em-arrow { font-size: 18pt; color: var(--text-muted); flex-shrink: 0; }
    .comp-badge { font-size: 8.5pt; font-weight: 600; padding: 3px 10px; border-radius: 999px; flex-shrink: 0; }
    .comp-match { background: var(--green-light); color: var(--green-mid); }
    .comp-under { background: var(--blue-light); color: var(--blue); }
    .comp-over { background: var(--red-light); color: var(--red); }

    /* Tables */
    table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-bottom: 12px; }
    th {
      background: var(--parchment-card); text-align: left;
      padding: 7px 10px; font-size: 8pt;
      text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--text-muted); border-bottom: 2px solid var(--border);
    }
    td { padding: 7px 10px; border-bottom: 1px solid #e8e0d0; vertical-align: top; }
    .code-cell { font-family: var(--font-mono); font-weight: 600; font-size: 9pt; white-space: nowrap; }
    .num-cell { font-family: var(--font-mono); text-align: right; white-space: nowrap; }
    .risk-cell { color: var(--red); font-weight: 600; }

    /* Financial */
    .financial-grid { display: flex; gap: 10px; margin-bottom: 14px; }
    .fin-metric {
      flex: 1; text-align: center; padding: 12px;
      border: 1px solid var(--border); border-radius: 6px; background: var(--parchment);
    }
    .fin-label { display: block; font-size: 8pt; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); margin-bottom: 4px; }
    .fin-value { display: block; font-family: var(--font-mono); font-size: 15pt; font-weight: 700; color: var(--green); }
    .fin-metric-risk .fin-value { color: var(--red); }
    .fin-metric-recovery .fin-value { color: var(--blue); }

    /* Payer findings */
    .pf-met { color: var(--green-mid); font-weight: 600; font-size: 8.5pt; }
    .pf-partial { color: var(--amber); font-weight: 600; font-size: 8.5pt; }
    .pf-not-met { color: var(--red); font-weight: 600; font-size: 8.5pt; }
    .detail-text { font-size: 9pt; color: var(--text-muted); }
    .impact-text { font-size: 9pt; color: var(--red); font-style: italic; }

    /* Code Cards */
    .code-card {
      border: 1px solid var(--border); border-radius: 8px;
      padding: 14px 16px; margin-bottom: 12px;
      background: white; page-break-inside: avoid;
    }
    .code-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
    .code-label {
      font-family: var(--font-mono); font-weight: 700; font-size: 11pt; color: var(--text);
      background: var(--parchment-card); padding: 2px 10px; border-radius: 4px; border: 1px solid var(--border);
    }
    .code-desc { flex: 1; font-size: 9.5pt; color: var(--text-muted); }
    .status-badge {
      font-size: 8pt; font-weight: 600; padding: 3px 10px; border-radius: 999px;
      text-transform: uppercase; letter-spacing: 0.04em; flex-shrink: 0;
    }
    .status-supported { background: var(--green-light); color: var(--green-mid); }
    .status-partial { background: var(--amber-light); color: var(--amber); }
    .status-not-supported { background: var(--red-light); color: var(--red); }

    .findings-block { padding: 10px 12px; border-radius: 6px; margin-bottom: 8px; border-left: 3px solid; }
    .findings-block h4 { font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; font-weight: 600; }
    .findings-block ul { list-style: none; padding: 0; }
    .findings-block li { font-size: 9.5pt; padding: 2px 0 2px 18px; position: relative; line-height: 1.5; }
    .findings-block li::before { position: absolute; left: 0; font-weight: 700; font-size: 10pt; }
    .findings-supported { background: #f0fdf4; border-color: var(--green-mid); }
    .findings-supported h4 { color: var(--green-mid); }
    .list-check::before { content: "\\2713"; color: var(--green-mid); }
    .findings-missing { background: var(--red-light); border-color: var(--red); }
    .findings-missing h4 { color: var(--red); }
    .list-x::before { content: "\\2717"; color: var(--red); }
    .findings-fixes { background: var(--blue-light); border-color: var(--blue); }
    .findings-fixes h4 { color: var(--blue); }
    .list-arrow::before { content: "\\2192"; color: var(--blue); }

    /* Recommendations */
    .rec-list { list-style: none; padding: 0; }
    .rec-list li {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 8px 12px; margin-bottom: 6px;
      background: var(--parchment); border-left: 3px solid var(--green);
      border-radius: 4px; font-size: 9.5pt; line-height: 1.5;
    }
    .rec-num {
      flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
      background: var(--green); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 8pt; font-weight: 700;
    }

    .rationale { font-size: 10pt; color: var(--text); line-height: 1.6; margin-bottom: 10px; }
    .revenue-impact {
      font-size: 9.5pt; font-weight: 600; padding: 8px 12px; border-radius: 6px;
      background: var(--blue-light); border-left: 3px solid var(--blue); color: var(--blue);
    }

    /* Footer */
    .report-footer {
      margin-top: 30px; padding-top: 10px; border-top: 1px solid var(--border);
      display: flex; justify-content: space-between;
      font-size: 7.5pt; color: var(--text-muted);
    }

    .disclaimer {
      margin-top: 16px; padding: 10px 14px;
      background: var(--amber-light); border: 1px solid #fde68a; border-radius: 6px;
      font-size: 8pt; color: var(--amber); line-height: 1.5;
    }

    @media print {
      .print-controls { display: none !important; }
      body { padding: 0; }
    }
    .print-controls {
      position: fixed; top: 16px; right: 16px; z-index: 100;
      display: flex; gap: 8px;
    }
    .print-controls button {
      font-family: var(--font-body); font-size: 10pt; font-weight: 600;
      padding: 8px 20px; border-radius: 8px; border: none; cursor: pointer;
    }
    .btn-print { background: var(--green); color: white; }
    .btn-print:hover { opacity: 0.9; }
    .btn-close { background: var(--parchment-card); color: var(--text); border: 1px solid var(--border) !important; }
    .btn-close:hover { background: #e8e0d0; }
  </style>
</head>
<body>
  <div class="print-controls">
    <button class="btn-print" onclick="window.print()">Save as PDF</button>
    <button class="btn-close" onclick="window.close()">Close</button>
  </div>

  <div class="letterhead">
    <div class="letterhead-left">
      <h1>DocDefend<span class="plus">+</span></h1>
      <div class="tagline">Pre-Claim Clinical Documentation QA</div>
    </div>
    <div class="letterhead-right">
      <strong>Defensibility Analysis Report</strong><br>
      ${escapeHtml(dateStr)} at ${escapeHtml(timeStr)}<br>
      Payer: ${escapeHtml(payerName)}
    </div>
  </div>

  <div class="score-banner ${scoreClass}">
    <div class="score-indicator">${escapeHtml(report.overallScore?.charAt(0) || '?')}</div>
    <div class="score-text">
      <h2>Defensibility Analysis</h2>
      <p>Pre-claim documentation review &middot; ${report.codeAnalysis?.length || 0} codes analyzed</p>
    </div>
    <span class="score-label">${escapeHtml(scoreLabel)}</span>
  </div>

  ${report.overallRiskSummary ? `
    <div class="risk-summary">
      <strong>Audit Risk Summary</strong>
      ${escapeHtml(report.overallRiskSummary)}
    </div>
  ` : ''}

  ${buildEMLevelSection(report.emLevelRecommendation, selectedCptCodes)}
  ${buildFinancialSection(report.financialImpact, selectedPayer)}
  ${buildPayerSection(report.payerSpecificFindings, payerName)}

  <div class="section">
    <h2>Code-by-Code Analysis</h2>
    <p class="section-subtitle">${report.codeAnalysis?.length || 0} codes reviewed</p>
    ${buildCodeAnalysisSection(report.codeAnalysis)}
  </div>

  ${buildRecommendationsSection(report.generalRecommendations)}

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by AI for informational purposes only and does not constitute medical, legal, or billing advice. All clinical documentation should be reviewed by qualified professionals before claim submission. DocDefend+ uses synthetic data for demonstration purposes.
  </div>

  <div class="report-footer">
    <span>DocDefend+ &middot; Clinical Documentation QA</span>
    <span>Generated ${escapeHtml(dateStr)} &middot; AI-powered analysis</span>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');

  if (!printWindow) {
    URL.revokeObjectURL(url);
    alert('Please allow popups to export the PDF report.');
    return;
  }

  // Clean up the blob URL after the window loads
  printWindow.addEventListener('load', () => {
    URL.revokeObjectURL(url);
  });
}
