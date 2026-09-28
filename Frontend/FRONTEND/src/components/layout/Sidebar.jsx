import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export default function Sidebar() {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useApp();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = [
    {
      title: 'Operational Core',
      items: [
        { path: '/', label: 'Safety Dashboard', icon: 'dashboard' },
        { path: '/reports', label: 'Incident Registry', icon: 'assignment_late' },
        { path: '/analysis', label: 'AI Diagnostic Studio', icon: 'psychology' },
        { path: '/reports/PROTO-10231', label: 'SIF Investigation', icon: 'warning' },
      ]
    },
    {
      title: 'Risk & Field Telemetry',
      items: [
        { path: '/analytics', label: 'Site Risk Analytics', icon: 'monitoring' },
        { path: '/patterns', label: 'Pattern & What-If', icon: 'hub' },
      ]
    },
    {
      title: 'Assurance & Governance',
      items: [
        { path: '/review', label: 'Review Queue', icon: 'rate_review', badge: '4' },
        { path: '/export', label: 'Executive Dossiers', icon: 'download' },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0F1E36] text-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 px-4 border-b border-slate-700/50 flex items-center justify-between flex-shrink-0">
        <NavLink to="/" className="flex items-center gap-3 min-w-0 group" onClick={() => setMobileOpen(false)}>
          <img
            alt="OIL Safety Intelligence Logo"
            className="h-8 w-8 object-contain flex-shrink-0 transition-transform group-hover:scale-105"
            src="/logo.svg"
          />
          {(!isSidebarCollapsed || mobileOpen) && (
            <div className="flex flex-col min-w-0">
              <span className="font-['Public_Sans'] font-bold text-sm tracking-wide text-white truncate leading-tight">
                OIL SAFETY
              </span>
              <span className="font-mono text-[10px] tracking-wider text-blue-300 font-semibold uppercase truncate">
                MISSION CONTROL AI
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden md:flex text-slate-400 hover:text-white p-1.5 rounded-md hover:bg-slate-800/80 transition-colors"
          title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          type="button"
        >
          <span className="material-symbols-outlined text-lg">
            {isSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {(!isSidebarCollapsed || mobileOpen) && (
              <div className="px-3 text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400 mb-2">
                {group.title}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    title={isSidebarCollapsed && !mobileOpen ? item.label : undefined}
                    className={`flex items-center ${
                      isSidebarCollapsed && !mobileOpen ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2.5 rounded-lg text-sm transition-all duration-150 group ${
                      isActive
                        ? 'bg-[#1E3A8A] text-white font-semibold shadow-sm ring-1 ring-blue-400/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`material-symbols-outlined text-xl leading-none flex-shrink-0 transition-colors ${
                          isActive ? 'text-blue-300' : 'text-slate-400 group-hover:text-slate-200'
                        }`}
                      >
                        {item.icon}
                      </span>
                      {(!isSidebarCollapsed || mobileOpen) && (
                        <span className="truncate tracking-normal text-[13px]">{item.label}</span>
                      )}
                    </div>
                    {(!isSidebarCollapsed || mobileOpen) && item.badge && (
                      <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-[11px] font-bold rounded-full shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Operational State Indicator */}
      {(!isSidebarCollapsed || mobileOpen) && (
        <div className="px-4 py-3 mx-3 mb-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-mono text-[11px] font-semibold text-emerald-400 uppercase tracking-wide">
              PROTOTYPE TELEMETRY
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Curated Safety Dataset (50 Reports)
          </p>
        </div>
      )}

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-[#0B172A] flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                alt="HSE Reviewer"
                className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-600"
                src="/avatar.png"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#0B172A]"></span>
            </div>
            {(!isSidebarCollapsed || mobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-white truncate">
                  Lead HSE Reviewer
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  Asset Safety Operations
                </span>
              </div>
            )}
          </div>
          {(!isSidebarCollapsed || mobileOpen) && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 bg-blue-950 text-blue-300 border border-blue-800/60 rounded">
              SIF-L4
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0F1E36] z-50 px-4 flex items-center justify-between border-b border-slate-700/50 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-white p-1 rounded hover:bg-slate-800"
            type="button"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="OIL Safety" className="h-7 w-7" />
            <span className="font-['Public_Sans'] font-bold text-sm text-white">OIL SAFETY</span>
          </div>
        </div>
        <span className="px-2 py-0.5 bg-red-600 text-white font-mono text-xs font-bold rounded-full">
          3 SIF
        </span>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden md:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
