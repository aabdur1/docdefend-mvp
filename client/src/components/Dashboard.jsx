import { useState, useEffect } from 'react';

// Simple bar chart component
function BarChart({ data, height = 120 }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="relative" style={{ height }}>
      <div className="flex items-end gap-2 h-full">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-lg transition-all duration-500 ${item.color}`}
              style={{
                height: `${(item.value / maxValue) * 100}%`,
                minHeight: item.value > 0 ? '8px' : '0',
                animationDelay: `${i * 100}ms`,
              }}
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
      {/* Baseline */}
      <div className="absolute bottom-5 left-0 right-0 border-b border-[#D6C9A8]/60 dark:border-instrument-border/60" />
    </div>
  );
}

// Donut chart component
function DonutChart({ data, size = 120 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
  let currentAngle = 0;

  const segments = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    return { ...item, startAngle, angle };
  });

  const createArcPath = (startAngle, angle, radius, innerRadius) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = 60 + radius * Math.cos(start);
    const y1 = 60 + radius * Math.sin(start);
    const x2 = 60 + radius * Math.cos(end);
    const y2 = 60 + radius * Math.sin(end);
    const x3 = 60 + innerRadius * Math.cos(end);
    const y3 = 60 + innerRadius * Math.sin(end);
    const x4 = 60 + innerRadius * Math.cos(start);
    const y4 = 60 + innerRadius * Math.sin(start);

    const largeArc = angle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {segments.map((segment, i) => (
          <path
            key={i}
            d={createArcPath(segment.startAngle, segment.angle || 0.1, 55, 35)}
            fill={segment.colorHex}
            className="transition-all duration-500 hover:opacity-80"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-slate-800 dark:text-white">{total}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
        </div>
      </div>
    </div>
  );
}

// Stat card component
function StatCard({ icon, label, value, change, color }) {
  const isPositive = change >= 0;

  return (
    <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl p-4 border border-[#D6C9A8] dark:border-instrument-border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium font-mono px-2 py-0.5 rounded-full ${
            isPositive
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {isPositive ? '+' : ''}{change}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold font-mono text-slate-800 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

// Recent analysis item
function RecentAnalysis({ analysis, index }) {
  const scoreColors = {
    HIGH: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    LOW: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const borderColors = {
    HIGH: 'border-l-healthcare-300 dark:border-l-trace',
    MEDIUM: 'border-l-amber-400 dark:border-l-amber-500',
    LOW: 'border-l-red-400 dark:border-l-red-500',
  };

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg border-l-2 ${borderColors[analysis.score] || ''} hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface/50 transition-colors animate-fadeInUp`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-800 dark:text-white truncate">{analysis.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-mono">{analysis.codes}</span> codes • {analysis.date}</p>
      </div>
      <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-mono ${scoreColors[analysis.score]}`}>
        {analysis.score}
      </span>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-[#EDE6D3] dark:bg-instrument-bg-surface flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h3 className="font-display text-lg text-slate-700 dark:text-slate-300 mb-2">No analyses yet</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
        Run your first defensibility analysis to see trends, scores, and insights here.
      </p>
    </div>
  );
}

export default function Dashboard({ isOpen, onClose, analysisHistory = [] }) {
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    avgScore: 0,
  });

  // Calculate stats from history
  useEffect(() => {
    if (analysisHistory.length > 0) {
      const highCount = analysisHistory.filter(a => a.score === 'HIGH').length;
      const mediumCount = analysisHistory.filter(a => a.score === 'MEDIUM').length;
      const lowCount = analysisHistory.filter(a => a.score === 'LOW').length;

      setStats({
        totalAnalyses: analysisHistory.length,
        highCount,
        mediumCount,
        lowCount,
        avgScore: Math.round((highCount * 100 + mediumCount * 50 + lowCount * 25) / analysisHistory.length),
      });
    }
  }, [analysisHistory]);

  const hasHistory = analysisHistory.length > 0;

  // Demo data for visualization
  const weeklyData = [
    { label: 'Mon', value: 3, color: 'bg-healthcare-500 dark:bg-trace' },
    { label: 'Tue', value: 5, color: 'bg-healthcare-500 dark:bg-trace' },
    { label: 'Wed', value: 2, color: 'bg-healthcare-500 dark:bg-trace' },
    { label: 'Thu', value: 7, color: 'bg-healthcare-500 dark:bg-trace' },
    { label: 'Fri', value: 4, color: 'bg-healthcare-500 dark:bg-trace' },
    { label: 'Sat', value: 1, color: 'bg-healthcare-400 dark:bg-trace-dim' },
    { label: 'Sun', value: 0, color: 'bg-healthcare-400 dark:bg-trace-dim' },
  ];

  const riskDistribution = [
    { label: 'High', value: stats.highCount || 12, colorHex: '#2D6A4F' },
    { label: 'Medium', value: stats.mediumCount || 8, colorHex: '#f59e0b' },
    { label: 'Low', value: stats.lowCount || 3, colorHex: '#ef4444' },
  ];

  const recentAnalyses = analysisHistory.slice(-5).reverse();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-2xl bg-[#FAF6EF] dark:bg-instrument-bg shadow-2xl animate-slideInPanel overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#F5EFE0] dark:bg-instrument-bg-raised border-b border-[#D6C9A8] dark:border-instrument-border px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-healthcare-500 flex items-center justify-center text-white shadow-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold font-display text-slate-800 dark:text-white">Provider Dashboard</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Defensibility analytics & trends</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#EDE6D3] dark:hover:bg-instrument-bg-surface transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {!hasHistory ? (
          <EmptyState />
        ) : (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                label="Total Analyses"
                value={stats.totalAnalyses}
                change={12}
                color="bg-healthcare-500 text-white"
              />
              <StatCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                label="Avg. Defensibility"
                value={`${stats.avgScore}%`}
                change={5}
                color="bg-[#52B788] text-white"
              />
              <StatCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
                label="High Defensibility"
                value={stats.highCount}
                color="bg-healthcare-300 text-white"
              />
              <StatCard
                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                label="Needs Improvement"
                value={stats.lowCount}
                color="bg-amber-500 text-white"
              />
            </div>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Weekly Activity */}
              <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl p-5 border border-[#D6C9A8] dark:border-instrument-border shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Weekly Activity</h3>
                <BarChart data={weeklyData} height={120} />
              </div>

              {/* Risk Distribution */}
              <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl p-5 border border-[#D6C9A8] dark:border-instrument-border shadow-sm">
                <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Risk Distribution</h3>
                <div className="flex items-center justify-center gap-6">
                  <DonutChart data={riskDistribution} size={120} />
                  <div className="space-y-2">
                    {riskDistribution.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.colorHex }} />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {item.label}: <span className="font-mono">{item.value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="bg-[#F5EFE0] dark:bg-instrument-bg-raised rounded-xl p-5 border border-[#D6C9A8] dark:border-instrument-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-white">Recent Analyses</h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">Last {recentAnalyses.length}</span>
              </div>
              <div className="space-y-1">
                {recentAnalyses.map((analysis, i) => (
                  <RecentAnalysis key={i} analysis={analysis} index={i} />
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl p-5 border border-amber-200/60 dark:border-amber-800/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300">Pro Tip</h4>
                  <p className="text-sm text-amber-700 dark:text-amber-300/80 mt-1">
                    Focus on documenting medical decision making (MDM) complexity. This is the most common area where documentation falls short for E/M code support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
