import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AlertDrawer from './AlertDrawer';
import Toast from './Toast';
import { useApp } from '../../context/AppContext';

export default function AppLayout() {
  const { isSidebarCollapsed } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F1E36] flex flex-col md:flex-row w-full overflow-x-hidden">
      {/* Global Command Navigation Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 w-full transition-all duration-300 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Fixed Header */}
        <Header />

        {/* Page Content with natural vertical scrolling and generous top offset for 64px header */}
        <main className="flex-1 w-full min-w-0 pt-16 flex flex-col">
          {/* Global Safety Governance Disclaimer Banner */}
          <div className="w-full bg-blue-950 border-b border-blue-900/60 text-blue-100 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-amber-400 text-sm flex-shrink-0">shield</span>
              <span>
                <strong className="text-white font-semibold">SAFETY DECISION SUPPORT:</strong> AI-generated analysis is advisory decision support and must be reviewed by qualified HSE personnel.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-blue-300">
              <span className="bg-blue-900/80 px-2 py-0.5 rounded border border-blue-800">
                PROTOTYPE MODE • 50 CURATED REPORTS
              </span>
              <span>PS ID: SIH26165</span>
            </div>
          </div>
          <Outlet />
        </main>
      </div>

      {/* Global SIF Alert Flyout Drawer */}
      <AlertDrawer />

      {/* Global Action Toast Notifications */}
      <Toast />
    </div>
  );
}
