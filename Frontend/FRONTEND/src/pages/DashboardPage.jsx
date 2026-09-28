import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { getApiUrl } from '../config/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentFacility, currentPeriod, showToast } = useApp();
  const [activeTimeframe, setActiveTimeframe] = useState('90D');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Authentic prototype dataset metrics (50 curated reports: 29 SIF, 21 Non-SIF)
  const [datasetStats, setDatasetStats] = useState({
    total: '50',
    sif: '29',
    sifRate: '58.0%',
    barrier: 'Energy Isolation / LOTO',
    actions: '4',
    validationRecall: null,
    datasetLabel: 'Curated Prototype Dataset (50 Reports: 29 SIF, 21 Non-SIF)'
  });

  // Fetch real analytics from backend if running
  React.useEffect(() => {
    fetch(getApiUrl('/api/analytics'))
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.total_reports) {
          setDatasetStats({
            total: String(data.total_reports),
            sif: String(data.sif_precursors),
            sifRate: data.psif_target_ratio || '58.0%',
            barrier: data.top_barrier_failure || 'Energy Isolation / LOTO',
            actions: '4',
            validationRecall: data.validation_recall || null,
            datasetLabel: data.dataset_label || 'Curated Prototype Dataset (50 Reports)'
          });
        }
      })
      .catch(() => {});
  }, []);

  const kpis = {
    total: datasetStats.total,
    sif: datasetStats.sif,
    barrier: datasetStats.barrier,
    actions: datasetStats.actions,
    validationRecall: datasetStats.validationRecall
  };

  // Monthly trend telemetry data (Sample prototype sequence)
  const trendData = [
    { month: 'Apr', sifRate: 4, breaches: 2, total: 8, baseline: 5.0 },
    { month: 'May', sifRate: 6, breaches: 3, total: 10, baseline: 5.0 },
    { month: 'Jun', sifRate: 8, breaches: 5, total: 12, baseline: 5.0 },
    { month: 'Jul', sifRate: 5, breaches: 3, total: 9, baseline: 5.0 },
    { month: 'Aug', sifRate: 7, breaches: 4, total: 11, baseline: 5.0 },
    { month: 'Sep', sifRate: 9, breaches: 6, total: 14, baseline: 5.0 },
  ];

  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* SECTION 1: HEADER & BREADCRUMB CONTEXT */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-[#0F1E36] text-white rounded tracking-wide">
              OIL-MISSION-CONTROL
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
              Assam Operational Basin • {currentFacility.split('(')[0]} • {currentPeriod}
            </span>
          </div>
          <h1 className="font-['Public_Sans'] font-extrabold text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Safety Intelligence & SIF Precursor Mission Control
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
            Predictive AI telemetry monitoring safety barrier degradation, high-consequence exposure vectors, and Serious Injury & Fatality (SIF) precursors across high-hazard exploration and drilling assets.
          </p>
        </div>

        {/* Global Quick Action Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Timeframe Pill Filters */}
          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            {['7D', '30D', '90D', 'YTD'].map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setActiveTimeframe(tf);
                  showToast(`Switched view to ${tf} window`);
                }}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeTimeframe === tf
                    ? 'bg-white text-slate-900 font-bold shadow-sm'
                    : 'hover:text-slate-900'
                }`}
                type="button"
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/analysis')}
            className="h-10 px-4 bg-[#0F1E36] hover:bg-[#162B4D] text-white text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:shadow"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-blue-300">psychology</span>
            <span>Analyze Observation</span>
          </button>

          <button
            onClick={() => navigate('/export')}
            className="h-10 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-base text-slate-500">picture_as_pdf</span>
            <span>Export Executive Dossier</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: EXECUTIVE KPI METRIC TILES */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            Operational Telemetry Baseline — {datasetStats.datasetLabel}
          </h2>
          <span className="text-xs font-mono text-slate-400">SIH-26165 Prototype Status</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* KPI 1 */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Reports Analyzed</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">description</span>
            </div>
            <div className="space-y-1">
              <div className="font-['Public_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpis.total}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                <span className="material-symbols-outlined text-sm">database</span>
                <span>Curated Prototype Dataset</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
              Based on 50-report prototype dataset
            </p>
          </div>

          {/* KPI 2: SIF Precursor - PROMINENT */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between border-l-4 border-l-red-600 bg-red-50/20">
            <div className="flex items-center justify-between text-red-700 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">SIF Precursors</span>
              <span className="material-symbols-outlined text-red-600 text-xl animate-pulse">warning</span>
            </div>
            <div className="space-y-1">
              <div className="font-['Public_Sans'] text-2xl sm:text-3xl font-extrabold text-red-600 tracking-tight">
                {kpis.sif}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-red-700 font-semibold">
                <span className="px-1.5 py-0.5 bg-red-100 rounded text-[11px] font-mono">{datasetStats.sifRate} pSIF Ratio</span>
                <span>High Consequence</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 border-t border-red-100 pt-2">
              Potential SIF events in curated set
            </p>
          </div>

          {/* KPI 3: Compromised Barrier */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Top Degraded Barrier</span>
              <span className="material-symbols-outlined text-amber-500 text-xl">shield_locked</span>
            </div>
            <div className="space-y-1">
              <div className="font-['Public_Sans'] text-base font-bold text-slate-900 leading-snug line-clamp-2">
                {kpis.barrier}
              </div>
              <div className="text-xs text-amber-700 font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error_outline</span>
                <span>Dominant barrier failure</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
              Frequent bow-tie defense breach
            </p>
          </div>

          {/* KPI 4: Open Remediation Actions */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Open Actions</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">pending_actions</span>
            </div>
            <div className="space-y-1">
              <div className="font-['Public_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpis.actions}
              </div>
              <div className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                <span>Demo triage items</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
              Pending HSE Officer reviews
            </p>
          </div>

          {/* KPI 5: Model SIF Recall */}
          {kpis.validationRecall && (
            <div className="cad-card-interactive p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-3">
                <span className="text-xs font-medium uppercase tracking-wider">SIF Recall</span>
                <span className="material-symbols-outlined text-blue-600 text-xl">verified</span>
              </div>
              <div className="space-y-1">
                <div className="font-['Public_Sans'] text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {kpis.validationRecall}
                </div>
                <div className="text-xs text-blue-700 font-semibold flex items-center gap-1">
                  <span>Backend validation metric</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 border-t border-slate-100 pt-2">
                Baseline Random Forest Classifier
              </p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 3: PRIMARY INTELLIGENCE VISUALIZATION - GIVEN AMPLE BREATHING ROOM */}
      <section className="cad-card p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-['Public_Sans'] text-lg sm:text-xl font-bold text-slate-900">
                SIF Precursor Trajectory & Defense Degradation Velocity
              </h2>
              <span className="font-mono text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold">
                6-MONTH LONGITUDINAL
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Multi-site longitudinal trend tracking rate of precursor incidents per 1,000 observations against the critical 8.0% tolerance ceiling.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600"></span>
              <span className="font-medium text-slate-700">SIF Precursor Rate (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="font-medium text-slate-700">Barrier Degradation Events</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 border-t-2 border-dashed border-red-400"></span>
              <span className="font-medium text-slate-500">SLA Ceiling (8%)</span>
            </div>
          </div>
        </div>

        {/* Responsive Fluid SVG Chart */}
        <div className="relative w-full h-72 sm:h-80 select-none">
          <svg
            viewBox="0 0 900 280"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="sifGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid horizontal lines */}
            {[0, 50, 100, 150, 200, 250].map((y) => (
              <line
                key={y}
                x1="40"
                y1={y}
                x2="880"
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* Threshold line at 8% (y = 80) */}
            <line
              x1="40"
              y1="80"
              x2="880"
              y2="80"
              stroke="#EF4444"
              strokeDasharray="6 6"
              strokeWidth="1.5"
            />
            <text x="885" y="84" fill="#DC2626" fontSize="10" fontFamily="JetBrains Mono" fontWeight="600">
              8.0% CEILING
            </text>

            {/* SIF Area Fill */}
            <path
              d="M 100 200 L 250 178 L 400 110 L 550 145 L 700 85 L 850 45 L 850 250 L 100 250 Z"
              fill="url(#sifGradient)"
            />

            {/* Barrier Degradation line (Amber) */}
            <path
              d="M 100 220 L 250 205 L 400 160 L 550 180 L 700 140 L 850 115"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* SIF Trend line (Red) */}
            <path
              d="M 100 200 L 250 178 L 400 110 L 550 145 L 700 85 L 850 45"
              fill="none"
              stroke="#DC2626"
              strokeWidth="3"
              strokeLinecap="round"
              className="animate-draw-line"
            />

            {/* Interactive Data points */}
            {trendData.map((d, i) => {
              const x = 100 + i * 150;
              const ySif = [200, 178, 110, 145, 85, 45][i];
              const isHovered = hoveredPoint === i;

              return (
                <g key={d.month} className="cursor-pointer">
                  {/* Point vertical hover guide */}
                  {isHovered && (
                    <line x1={x} y1="10" x2={x} y2="250" stroke="#94A3B8" strokeWidth="1" strokeDasharray="2 2" />
                  )}

                  {/* SIF point */}
                  <circle
                    cx={x}
                    cy={ySif}
                    r={isHovered ? 7 : 5}
                    fill="#DC2626"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredPoint(i)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />

                  {/* Month Label */}
                  <text
                    x={x}
                    y="270"
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="11"
                    fontFamily="Inter"
                    fontWeight={isHovered ? '700' : '500'}
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoveredPoint !== null && (
            <div
              className="absolute z-30 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none transition-all"
              style={{
                left: `${12 + hoveredPoint * 16.5}%`,
                top: '20px'
              }}
            >
              <div className="font-mono font-bold text-amber-400 mb-1">
                {trendData[hoveredPoint].month} 2026 Audit
              </div>
              <div>SIF Precursor Rate: <strong className="text-red-400">{trendData[hoveredPoint].sifRate}%</strong></div>
              <div>Barrier Failures: <strong>{trendData[hoveredPoint].breaches}</strong></div>
              <div>Total Obs: <strong>{trendData[hoveredPoint].total.toLocaleString()}</strong></div>
            </div>
          )}
        </div>

        {/* Analysis Annotation Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="material-symbols-outlined text-amber-600 text-lg">insights</span>
            <span>
              <strong>AI Diagnostic Vector:</strong> The 42% escalation in August-September correlates with contractor shift changeovers and monsoon LOTO bypasses at Duliajan Rig #4.
            </span>
          </div>
          <button
            onClick={() => navigate('/patterns')}
            className="text-blue-700 hover:text-blue-800 font-bold hover:underline whitespace-nowrap flex items-center gap-1 cursor-pointer"
          >
            <span>Simulate What-If Mitigation</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </section>

      {/* SECTION 4: RISK DISTRIBUTION & LIFE-SAVING RULES GRID */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Risk Distribution Matrix */}
        <div className="cad-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-['Public_Sans'] font-bold text-base text-slate-900">
                Precursor Risk Distribution Matrix
              </h3>
              <p className="text-xs text-slate-500">Consequence Severity vs Likelihood of Occurrence</p>
            </div>
            <span className="text-xs font-mono text-slate-500">142 Precursors Categorized</span>
          </div>

          <div className="grid grid-cols-5 gap-2 text-center text-[11px] font-mono select-none">
            {/* Row 5: Catastrophic */}
            <div className="p-3 bg-amber-100 border border-amber-300 rounded font-bold text-amber-900">12 Low</div>
            <div className="p-3 bg-orange-100 border border-orange-300 rounded font-bold text-orange-900">22 Med</div>
            <div className="p-3 bg-red-100 border border-red-300 rounded font-bold text-red-900">38 High</div>
            <div className="p-3 bg-red-600 text-white rounded font-extrabold shadow-sm ring-2 ring-red-400">42 SIF</div>
            <div className="p-3 bg-red-800 text-white rounded font-extrabold shadow-sm">28 SIF</div>

            {/* Row 4: Critical */}
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-900">8 Low</div>
            <div className="p-3 bg-amber-100 border border-amber-300 rounded font-bold text-amber-900">19 Med</div>
            <div className="p-3 bg-orange-100 border border-orange-300 rounded font-bold text-orange-900">31 High</div>
            <div className="p-3 bg-red-600 text-white rounded font-extrabold">34 SIF</div>
            <div className="p-3 bg-red-700 text-white rounded font-extrabold">16 SIF</div>

            {/* Row 3: Moderate */}
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-900">24 Safe</div>
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded text-emerald-900">18 Safe</div>
            <div className="p-3 bg-amber-100 border border-amber-300 rounded font-bold text-amber-900">14 Med</div>
            <div className="p-3 bg-orange-100 border border-orange-300 rounded font-bold text-orange-900">12 High</div>
            <div className="p-3 bg-red-500 text-white rounded font-bold">8 SIF</div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Critical SIF Precursor (Action Within 24h)</span>
            </span>
            <button
              onClick={() => navigate('/reports?severity=SIF')}
              className="text-blue-700 font-semibold hover:underline cursor-pointer"
            >
              Filter Incident Records
            </button>
          </div>
        </div>

        {/* Right: Life-Saving Rules Compliance */}
        <div className="cad-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-['Public_Sans'] font-bold text-base text-slate-900">
                Life-Saving Rules Compliance Health
              </h3>
              <p className="text-xs text-slate-500">IOGP standard high-consequence barrier adherence</p>
            </div>
            <span className="font-mono text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-bold">
              88.4% OVERALL
            </span>
          </div>

          <div className="space-y-4">
            {[
              { rule: 'Energy Isolation & Lockout/Tagout', score: 72, count: 48, status: 'Vulnerable', color: 'bg-red-600' },
              { rule: 'Bypassing Safety Controls & Interlocks', score: 65, count: 29, status: 'Critical Risk', color: 'bg-red-600' },
              { rule: 'Confined Space Atmospheric Testing', score: 88, count: 12, status: 'Monitored', color: 'bg-amber-500' },
              { rule: 'Work Authorization & Permit to Work', score: 94, count: 6, status: 'Good', color: 'bg-emerald-600' },
              { rule: 'Working at Heights & Fall Arrest', score: 91, count: 9, status: 'Good', color: 'bg-emerald-600' },
            ].map((r) => (
              <div key={r.rule} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{r.rule}</span>
                  <span className="font-mono font-bold text-slate-700">{r.score}% ({r.count} breaches)</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${r.color} rounded-full transition-all duration-500`}
                    style={{ width: `${r.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Audited across 4 active regional operational assets</span>
            <button
              onClick={() => navigate('/analytics')}
              className="text-blue-700 font-semibold hover:underline cursor-pointer"
            >
              Inspect Asset Breakdown
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 5: HAZARD CATEGORIES & SITE RISK RANKING */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Top Hazard Categories */}
        <div className="cad-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-['Public_Sans'] font-bold text-base text-slate-900">
                Dominant SIF Hazard Mechanisms
              </h3>
              <p className="text-xs text-slate-500">Categorized by physical energy release vectors</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="text-xs text-blue-700 font-semibold hover:underline cursor-pointer"
            >
              View All Categories
            </button>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Line of Fire (Tubulars & Heavy Swings)', pct: 34, reports: 10, icon: 'dangerous', color: 'text-red-600 bg-red-50' },
              { name: 'Stored Energy & Fluid Pressure (>40 bar)', pct: 28, reports: 8, icon: 'speed', color: 'text-orange-600 bg-orange-50' },
              { name: 'Dropped Objects from Derrick Floor', pct: 17, reports: 5, icon: 'vertical_align_bottom', color: 'text-amber-600 bg-amber-50' },
              { name: 'Toxic Gas H2S Atmospheric Accumulation', pct: 14, reports: 4, icon: 'cloud', color: 'text-blue-600 bg-blue-50' },
              { name: 'Confined Space Oxygen Depletion', pct: 7, reports: 2, icon: 'air', color: 'text-slate-600 bg-slate-50' },
            ].map((h) => (
              <div
                key={h.name}
                className="p-3.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between gap-4 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`material-symbols-outlined p-2 rounded-lg ${h.color} text-lg`}>
                    {h.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{h.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{h.reports} prototype precursor records</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-mono text-sm font-bold text-slate-900">{h.pct}%</div>
                  <div className="text-[10px] text-slate-400">of SIF total</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Site Risk Ranking Benchmark */}
        <div className="cad-card p-6 sm:p-7 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-['Public_Sans'] font-bold text-base text-slate-900">
                Asset Site Risk Composite Ranking
              </h3>
              <p className="text-xs text-slate-500">Evaluated on precursor frequency & barrier failure density</p>
            </div>
            <span className="font-mono text-xs text-slate-400">Assam Asset Basin</span>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Duliajan Drilling Rig #4', index: 88, status: 'HIGH RISK', statusColor: 'bg-red-100 text-red-700 border-red-200', precursors: 58, actions: 12 },
              { name: 'Moran Central Tank Farm', index: 74, status: 'ELEVATED', statusColor: 'bg-orange-100 text-orange-700 border-orange-200', precursors: 42, actions: 9 },
              { name: 'Digboi Feeder Line 9', index: 59, status: 'MODERATE', statusColor: 'bg-amber-100 text-amber-700 border-amber-200', precursors: 26, actions: 5 },
              { name: 'Nahorkatiya Compressor Station', index: 32, status: 'NOMINAL', statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-200', precursors: 16, actions: 2 },
            ].map((site) => (
              <div
                key={site.name}
                onClick={() => navigate('/analytics')}
                className="p-4 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer hover:border-blue-400 group"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {site.name}
                    </span>
                    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${site.statusColor}`}>
                      {site.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {site.precursors} SIF precursors identified • {site.actions} actions outstanding
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-base font-extrabold text-slate-900">{site.index} / 100</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Risk Composite</div>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-blue-600 text-base">
                    arrow_forward
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 6: LIVE CRITICAL SIF PRECURSOR ALERTS (CALLOUT SECTION) */}
      <section className="cad-card p-6 sm:p-8 space-y-6 border-l-4 border-l-red-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
              <h2 className="font-['Public_Sans'] text-lg sm:text-xl font-bold text-slate-900">
                AI-Flagged SIF Precursor Queue
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Observations flagged by AI NLP parser requiring prompt HSE review.
            </p>
          </div>

          <button
            onClick={() => navigate('/reports')}
            className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Prototype Incident Repository (50 items)</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Alert Card 1 */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between border-t-2 border-t-red-600">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-blue-700">#PROTO-10231 (Demo)</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded border border-red-200">
                  0.94 SIF RISK SCORE
                </span>
              </div>
              <h4 className="font-['Public_Sans'] font-bold text-sm text-slate-900 leading-snug">
                Energy Isolation Failure During Pump P-302 Maintenance
              </h4>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                Technicians unbolted casing flange before double-block-and-bleed verification. Upstream bypass valve cracked under 42 bar residual line pressure.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                <span>Duliajan Rig #4 (Night Handover)</span>
              </div>
              <button
                onClick={() => navigate('/reports/PROTO-10231')}
                className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Deep Dive SIF Investigation</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Alert Card 2 */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between border-t-2 border-t-orange-500">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-blue-700">#PROTO-10228 (Demo)</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-700 rounded border border-orange-200">
                  0.88 SIF RISK SCORE
                </span>
              </div>
              <h4 className="font-['Public_Sans'] font-bold text-sm text-slate-900 leading-snug">
                Atmospheric H2S Sensor Drift in Crude Tank Diked Zone
              </h4>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                Fixed detection unit near Tank TK-104 showed sensor drift fault ERR-04. Cleaning crew entering area without multi-gas bump calibration.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                <span>Moran Central Tank Farm</span>
              </div>
              <button
                onClick={() => navigate('/reports/PROTO-10231')}
                className="w-full h-9 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Review Precursor Vector</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Alert Card 3 */}
          <div className="cad-card-interactive p-5 flex flex-col justify-between border-t-2 border-t-amber-500">
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-blue-700">#PROTO-10219 (Demo)</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded border border-amber-200">
                  0.81 SIF RISK SCORE
                </span>
              </div>
              <h4 className="font-['Public_Sans'] font-bold text-sm text-slate-900 leading-snug">
                Crane Hoist Wire-Rope Strand Disruption in SIMOPS Corridor
              </h4>
              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                14-ton separator spool hoisted across pressurized pipeline corridor with visible core strand fatigue and missing drop exclusion boundary.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div className="text-slate-500 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                <span>Digboi Feeder Line 9</span>
              </div>
              <button
                onClick={() => navigate('/reports/PROTO-10231')}
                className="w-full h-9 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Review Precursor Vector</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
