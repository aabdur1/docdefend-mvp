import { useState, useRef, useCallback } from 'react';

const CPT_CODES = [
  { code: '99213', description: 'E/M Level 3, established patient' },
  { code: '99214', description: 'E/M Level 4, established patient' },
  { code: '99215', description: 'E/M Level 5, established patient' },
  { code: '99203', description: 'E/M Level 3, new patient' },
  { code: '99204', description: 'E/M Level 4, new patient' },
  { code: '99205', description: 'E/M Level 5, new patient' },
  { code: '99391', description: 'Preventive visit, age 1-4' },
  { code: '99392', description: 'Preventive visit, age 5-11' },
  { code: '99393', description: 'Preventive visit, age 12-17' },
  { code: '99395', description: 'Preventive visit, age 18-39' },
  { code: '99396', description: 'Preventive visit, age 40-64' },
  { code: '99397', description: 'Preventive visit, age 65+' },
  { code: '99381', description: 'New patient preventive, age 1-4' },
  { code: '96127', description: 'Behavioral screening (PHQ-9, GAD-7)' },
  { code: '90471', description: 'Immunization administration' },
  { code: '96372', description: 'Therapeutic injection' },
  { code: '64483', description: 'Epidural injection, lumbar/sacral' },
  { code: '64490', description: 'Facet joint injection, lumbar' },
  { code: '20610', description: 'Large joint injection' },
  { code: '77003', description: 'Fluoroscopic guidance' },
  { code: '64635', description: 'Radiofrequency ablation, lumbar' },
];

const ICD10_CODES = [
  { code: 'E11.65', description: 'Type 2 diabetes with hyperglycemia' },
  { code: 'E11.9', description: 'Type 2 diabetes without complications' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'E78.5', description: 'Hyperlipidemia, unspecified' },
  { code: 'J06.9', description: 'Acute upper respiratory infection' },
  { code: 'F41.1', description: 'Generalized anxiety disorder' },
  { code: 'G47.00', description: 'Insomnia, unspecified' },
  { code: 'Z00.129', description: 'Well-child exam, no abnormal findings' },
  { code: 'M17.0', description: 'Bilateral primary osteoarthritis, knee' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'M54.2', description: 'Cervicalgia' },
  { code: 'M47.816', description: 'Spondylosis, lumbar' },
  { code: 'M51.16', description: 'Disc disorder, lumbar' },
  { code: 'G89.29', description: 'Other chronic pain' },
  { code: 'M79.3', description: 'Panniculitis' },
  { code: 'G89.4', description: 'Chronic pain syndrome' },
  { code: 'M54.41', description: 'Lumbago with sciatica, right side' },
  { code: 'M54.42', description: 'Lumbago with sciatica, left side' },
];

function CodeCheckbox({ code, description, checked, onChange }) {
  return (
    <label className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface cursor-pointer transition-all duration-200 hover:-translate-y-0.5 group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 rounded border-[#D6C9A8] dark:border-instrument-border text-healthcare-600 focus:ring-healthcare-500 dark:bg-instrument-bg-surface transition-transform duration-200 group-hover:scale-110"
      />
      <div className="flex-1">
        <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-healthcare-600 dark:group-hover:text-healthcare-400 transition-colors">{code}</span>
        <span className="text-sm text-slate-500 dark:text-slate-400 ml-2">{description}</span>
      </div>
      {checked && (
        <span className="text-healthcare-500 check-pop">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </label>
  );
}

function CustomCodeInput({ value, onChange, onAdd, placeholder, duplicateError }) {
  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 text-sm border border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500 bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white shadow-sm transition-shadow duration-200 focus:shadow-md"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && value.trim()) {
              onAdd();
            }
          }}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!value.trim()}
          className="px-4 py-2 text-sm font-medium bg-healthcare-500 text-white rounded-xl hover:bg-healthcare-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 btn-lift"
        >
          Add
        </button>
      </div>
      {duplicateError && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 animate-fadeIn">
          Code already exists in the list.
        </p>
      )}
    </div>
  );
}

export default function CodeSelector({
  selectedCptCodes,
  onCptChange,
  selectedIcd10Codes,
  onIcd10Change,
}) {
  const [customCpt, setCustomCpt] = useState('');
  const [customIcd10, setCustomIcd10] = useState('');
  const [customCptCodes, setCustomCptCodes] = useState([]);
  const [customIcd10Codes, setCustomIcd10Codes] = useState([]);
  const [cptDuplicateError, setCptDuplicateError] = useState(false);
  const [icd10DuplicateError, setIcd10DuplicateError] = useState(false);
  const cptDupTimer = useRef(null);
  const icd10DupTimer = useRef(null);

  const toggleCode = (code, selected, setSelected) => {
    if (selected.includes(code)) {
      setSelected(selected.filter((c) => c !== code));
    } else {
      setSelected([...selected, code]);
    }
  };

  const addCustomCpt = useCallback(() => {
    const trimmed = customCpt.trim();
    if (!trimmed) return;
    if (selectedCptCodes.includes(trimmed)) {
      setCptDuplicateError(true);
      clearTimeout(cptDupTimer.current);
      cptDupTimer.current = setTimeout(() => setCptDuplicateError(false), 2000);
      return;
    }
    setCptDuplicateError(false);
    setCustomCptCodes((prev) => [...prev, trimmed]);
    onCptChange([...selectedCptCodes, trimmed]);
    setCustomCpt('');
  }, [customCpt, selectedCptCodes, onCptChange]);

  const addCustomIcd10 = useCallback(() => {
    const trimmed = customIcd10.trim();
    if (!trimmed) return;
    if (selectedIcd10Codes.includes(trimmed)) {
      setIcd10DuplicateError(true);
      clearTimeout(icd10DupTimer.current);
      icd10DupTimer.current = setTimeout(() => setIcd10DuplicateError(false), 2000);
      return;
    }
    setIcd10DuplicateError(false);
    setCustomIcd10Codes((prev) => [...prev, trimmed]);
    onIcd10Change([...selectedIcd10Codes, trimmed]);
    setCustomIcd10('');
  }, [customIcd10, selectedIcd10Codes, onIcd10Change]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="animate-slideInLeft">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-mono font-bold">
            CPT
          </span>
          CPT Codes
          {selectedCptCodes.length > 0 && (
            <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-healthcare-100 dark:bg-healthcare-900/40 text-healthcare-700 dark:text-healthcare-300 rounded-full animate-scaleIn">
              {selectedCptCodes.length} selected
            </span>
          )}
        </h3>
        <div className="border border-[#D6C9A8] dark:border-instrument-border rounded-xl max-h-64 overflow-y-auto bg-[#F5EFE0] dark:bg-instrument-bg-raised shadow-sm hover:shadow-md transition-shadow duration-300 scroll-fade">
          {CPT_CODES.map((item) => (
            <CodeCheckbox
              key={item.code}
              code={item.code}
              description={item.description}
              checked={selectedCptCodes.includes(item.code)}
              onChange={() => toggleCode(item.code, selectedCptCodes, onCptChange)}
            />
          ))}
          {customCptCodes.map((code) => (
            <CodeCheckbox
              key={code}
              code={code}
              description="(Custom)"
              checked={selectedCptCodes.includes(code)}
              onChange={() => toggleCode(code, selectedCptCodes, onCptChange)}
            />
          ))}
        </div>
        <CustomCodeInput
          value={customCpt}
          onChange={setCustomCpt}
          onAdd={addCustomCpt}
          placeholder="Add custom CPT code..."
          duplicateError={cptDuplicateError}
        />
      </div>

      <div className="animate-slideInRight">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-mono font-bold">
            ICD
          </span>
          ICD-10 Codes
          {selectedIcd10Codes.length > 0 && (
            <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-healthcare-100 dark:bg-healthcare-900/40 text-healthcare-700 dark:text-healthcare-300 rounded-full animate-scaleIn">
              {selectedIcd10Codes.length} selected
            </span>
          )}
        </h3>
        <div className="border border-[#D6C9A8] dark:border-instrument-border rounded-xl max-h-64 overflow-y-auto bg-[#F5EFE0] dark:bg-instrument-bg-raised shadow-sm hover:shadow-md transition-shadow duration-300 scroll-fade">
          {ICD10_CODES.map((item) => (
            <CodeCheckbox
              key={item.code}
              code={item.code}
              description={item.description}
              checked={selectedIcd10Codes.includes(item.code)}
              onChange={() => toggleCode(item.code, selectedIcd10Codes, onIcd10Change)}
            />
          ))}
          {customIcd10Codes.map((code) => (
            <CodeCheckbox
              key={code}
              code={code}
              description="(Custom)"
              checked={selectedIcd10Codes.includes(code)}
              onChange={() => toggleCode(code, selectedIcd10Codes, onIcd10Change)}
            />
          ))}
        </div>
        <CustomCodeInput
          value={customIcd10}
          onChange={setCustomIcd10}
          onAdd={addCustomIcd10}
          placeholder="Add custom ICD-10 code..."
          duplicateError={icd10DuplicateError}
        />
      </div>
    </div>
  );
}
