const riskConfig = {
  HIGH: {
    bg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200/50 dark:border-green-700/50',
    shadow: 'shadow-green-500/20',
    icon: '✓',
    label: 'High Defensibility',
  },
  MEDIUM: {
    bg: 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200/50 dark:border-yellow-700/50',
    shadow: 'shadow-yellow-500/20',
    icon: '!',
    label: 'Medium Defensibility',
  },
  LOW: {
    bg: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200/50 dark:border-red-700/50',
    shadow: 'shadow-red-500/20',
    icon: '✗',
    label: 'Low Defensibility',
  },
  SUPPORTED: {
    bg: 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-200/50 dark:border-green-700/50',
    shadow: 'shadow-green-500/20',
    icon: '✓',
    label: 'Supported',
  },
  PARTIALLY_SUPPORTED: {
    bg: 'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/40 dark:to-amber-900/40',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200/50 dark:border-yellow-700/50',
    shadow: 'shadow-yellow-500/20',
    icon: '~',
    label: 'Partially Supported',
  },
  NOT_SUPPORTED: {
    bg: 'bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/40 dark:to-rose-900/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200/50 dark:border-red-700/50',
    shadow: 'shadow-red-500/20',
    icon: '✗',
    label: 'Not Supported',
  },
};

export default function RiskBadge({ level, size = 'md' }) {
  const config = riskConfig[level] || riskConfig.MEDIUM;

  const sizeClasses = size === 'lg'
    ? 'px-5 py-2.5 text-sm font-semibold gap-2'
    : 'px-3 py-1.5 text-xs font-medium gap-1.5';

  return (
    <span
      className={`
        inline-flex items-center rounded-full border backdrop-blur-sm
        ${config.bg} ${config.text} ${config.border} ${sizeClasses}
        shadow-lg ${config.shadow}
        transition-all duration-300 hover:scale-105
        animate-scaleIn
      `}
    >
      <span className={`${size === 'lg' ? 'text-base' : 'text-xs'} font-bold`}>
        {config.icon}
      </span>
      {config.label}
    </span>
  );
}
