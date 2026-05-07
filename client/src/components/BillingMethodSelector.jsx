import { useState, useRef, useEffect, useCallback } from 'react';

function mapTimeToCode(minutes, patientType) {
  const m = parseInt(minutes, 10);
  if (!m || m < 1) return null;

  if (patientType === 'new') {
    if (m < 15) return null;
    if (m < 30) return { emCode: '99202', prolongedCount: 0 };
    if (m < 45) return { emCode: '99203', prolongedCount: 0 };
    if (m < 60) return { emCode: '99204', prolongedCount: 0 };
    if (m < 75) return { emCode: '99205', prolongedCount: 0 };
    return { emCode: '99205', prolongedCount: Math.floor((m - 75) / 15) + 1 };
  } else {
    if (m < 10) return null;
    if (m < 20) return { emCode: '99212', prolongedCount: 0 };
    if (m < 30) return { emCode: '99213', prolongedCount: 0 };
    if (m < 40) return { emCode: '99214', prolongedCount: 0 };
    if (m < 55) return { emCode: '99215', prolongedCount: 0 };
    return { emCode: '99215', prolongedCount: Math.floor((m - 55) / 15) + 1 };
  }
}

function getCodeHint(minutes, patientType) {
  const result = mapTimeToCode(minutes, patientType);
  if (!result) {
    const minRequired = patientType === 'new' ? 15 : 10;
    return parseInt(minutes, 10) > 0 ? `Minimum ${minRequired} min required` : null;
  }
  const codes = [result.emCode, ...Array(result.prolongedCount).fill('99417')];
  return `→ ${codes.join(' + ')} auto-selected`;
}

function buildAutoSelectCodes(minutes, patientType) {
  const result = mapTimeToCode(minutes, patientType);
  if (!result) return [];
  return [result.emCode, ...Array(result.prolongedCount).fill('99417')];
}

export default function BillingMethodSelector({
  billingMethod,
  onBillingMethodChange,
  totalMinutes,
  onTotalMinutesChange,
  patientType,
  onPatientTypeChange,
  onCodeAutoSelect,
}) {
  const tabContainerRef = useRef(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    if (!tabContainerRef.current) return;
    const activeBtn = tabContainerRef.current.querySelector('[data-active="true"]');
    if (activeBtn) {
      const containerRect = tabContainerRef.current.getBoundingClientRect();
      const btnRect = activeBtn.getBoundingClientRect();
      setTabIndicator({ left: btnRect.left - containerRect.left, width: btnRect.width });
    }
  }, []);

  useEffect(() => { updateIndicator(); }, [billingMethod, updateIndicator]);

  useEffect(() => {
    let timeoutId;
    const debouncedUpdate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateIndicator, 300);
    };
    window.addEventListener('resize', debouncedUpdate);
    return () => {
      window.removeEventListener('resize', debouncedUpdate);
      clearTimeout(timeoutId);
    };
  }, [updateIndicator]);

  const handleMinutesChange = (value) => {
    onTotalMinutesChange(value);
    onCodeAutoSelect(buildAutoSelectCodes(value, patientType));
  };

  const handlePatientTypeChange = (type) => {
    onPatientTypeChange(type);
    if (totalMinutes) {
      onCodeAutoSelect(buildAutoSelectCodes(totalMinutes, type));
    }
  };

  const hint = billingMethod === 'TIME' ? getCodeHint(totalMinutes, patientType) : null;

  return (
    <div className="flex items-center gap-3 flex-wrap p-4 bg-[#EDE6D3] dark:bg-instrument-bg-surface rounded-xl border border-[#D6C9A8] dark:border-instrument-border">
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
        Billing Method:
      </span>

      {/* MDM / Time toggle */}
      <div
        ref={tabContainerRef}
        role="radiogroup"
        aria-label="Billing method"
        className="relative flex gap-1 p-1 bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl"
      >
        <div
          className="absolute top-1 bottom-1 bg-healthcare-500 dark:bg-trace-dim rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
          style={{ left: tabIndicator.left, width: tabIndicator.width }}
        />
        {['MDM', 'TIME'].map((method) => (
          <button
            key={method}
            type="button"
            role="radio"
            aria-checked={billingMethod === method}
            data-active={billingMethod === method}
            onClick={() => onBillingMethodChange(method)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
              billingMethod === method
                ? 'text-white'
                : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {method === 'MDM' ? 'MDM-Based' : 'Time-Based'}
          </button>
        ))}
      </div>

      {/* Time-Based controls — shown only when TIME is active */}
      {billingMethod === 'TIME' && (
        <>
          {/* Patient type */}
          <div
            role="radiogroup"
            aria-label="Patient type"
            className="flex gap-1 p-1 bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl"
          >
            {[
              { value: 'new', label: 'New Patient' },
              { value: 'established', label: 'Established' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={patientType === value}
                onClick={() => handlePatientTypeChange(value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  patientType === value
                    ? 'bg-healthcare-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-instrument-text-muted hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Minutes input */}
          <div className="flex items-center gap-2">
            <label htmlFor="billing-total-minutes" className="sr-only">
              Total time on date of encounter in minutes
            </label>
            <input
              id="billing-total-minutes"
              type="number"
              min="1"
              max="300"
              value={totalMinutes}
              onChange={(e) => handleMinutesChange(e.target.value)}
              placeholder="e.g. 45"
              className="w-24 px-3 py-1.5 text-sm border border-[#D6C9A8] dark:border-instrument-border rounded-xl focus:ring-2 focus:ring-healthcare-500 focus:border-healthcare-500 bg-[#F5EFE0] dark:bg-instrument-bg-surface dark:text-white shadow-sm transition-shadow"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">min</span>
          </div>

          {/* Auto-select hint */}
          {hint && (
            <span
              className={`text-sm font-medium ${
                hint.startsWith('→')
                  ? 'text-healthcare-600 dark:text-healthcare-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {hint}
            </span>
          )}
        </>
      )}
    </div>
  );
}
