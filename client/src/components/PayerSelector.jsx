const PAYER_OPTIONS = [
  {
    id: null,
    name: 'Medicare',
    shortName: 'CMS',
    description: 'Default CMS guidelines',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    colorClasses: {
      border: 'border-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      iconText: 'text-blue-600 dark:text-blue-400',
    },
  },
  {
    id: 'united',
    name: 'United Healthcare',
    shortName: 'UHC',
    description: 'Commercial plans',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    colorClasses: {
      border: 'border-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-700 dark:text-orange-300',
      iconBg: 'bg-orange-100 dark:bg-orange-900/50',
      iconText: 'text-orange-600 dark:text-orange-400',
    },
  },
  {
    id: 'aetna',
    name: 'Aetna',
    shortName: 'Aetna',
    description: 'Commercial plans',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    colorClasses: {
      border: 'border-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-700 dark:text-purple-300',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      iconText: 'text-purple-600 dark:text-purple-400',
    },
  },
  {
    id: 'bcbs',
    name: 'BCBS',
    shortName: 'BCBS',
    description: 'Blue Cross Blue Shield',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m-8-8h16" />
      </svg>
    ),
    colorClasses: {
      border: 'border-sky-500',
      bg: 'bg-sky-50 dark:bg-sky-900/20',
      text: 'text-sky-700 dark:text-sky-300',
      iconBg: 'bg-sky-100 dark:bg-sky-900/50',
      iconText: 'text-sky-600 dark:text-sky-400',
    },
  },
];

export default function PayerSelector({ selectedPayer, onPayerChange }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-healthcare-500 flex items-center justify-center text-white shadow-lg shadow-healthcare-500/30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold font-display text-slate-800 dark:text-white">Payer</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select insurance payer for targeted analysis</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {PAYER_OPTIONS.map((payer) => {
          const isSelected = selectedPayer === payer.id;
          const colors = payer.colorClasses;

          return (
            <button
              key={payer.id || 'medicare'}
              onClick={() => onPayerChange(payer.id)}
              aria-label={`Select ${payer.name} as payer`}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                isSelected
                  ? `${colors.border} ${colors.bg} shadow-md`
                  : 'border-[#D6C9A8] dark:border-instrument-border bg-[#F5EFE0] dark:bg-instrument-bg-raised hover:border-[#C4B48E] dark:hover:border-instrument-border-hover hover:shadow-sm'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  isSelected
                    ? `${colors.iconBg} ${colors.iconText}`
                    : 'bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-500 dark:text-slate-400 group-hover:bg-[#E5DBBF] dark:group-hover:bg-instrument-bg-hover'
                }`}
              >
                {payer.icon}
              </div>
              <div className="text-center">
                <p
                  className={`text-sm font-semibold transition-colors ${
                    isSelected ? colors.text : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {payer.shortName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5 hidden sm:block">
                  {payer.description}
                </p>
              </div>
              {isSelected && (
                <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${colors.border.replace('border-', 'bg-')}`} />
              )}
              {payer.id === null && (
                <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[#EDE6D3] dark:bg-instrument-bg-surface text-slate-600 dark:text-slate-400 leading-none">
                  Default
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
