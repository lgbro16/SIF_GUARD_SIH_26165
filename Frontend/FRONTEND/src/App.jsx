import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';

import DashboardPage from './pages/DashboardPage';
import ReportsRepositoryPage from './pages/ReportsRepositoryPage';
import ReportDetailPage from './pages/ReportDetailPage';
import AIAnalysisStudioPage from './pages/AIAnalysisStudioPage';
import SiteAnalyticsPage from './pages/SiteAnalyticsPage';
import PatternIntelligencePage from './pages/PatternIntelligencePage';
import ReviewQueuePage from './pages/ReviewQueuePage';
import ExportDossierPage from './pages/ExportDossierPage';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="reports" element={<ReportsRepositoryPage />} />
            <Route path="reports/:id" element={<ReportDetailPage />} />
            <Route path="analysis" element={<AIAnalysisStudioPage />} />
            <Route path="analytics" element={<SiteAnalyticsPage />} />
            <Route path="patterns" element={<PatternIntelligencePage />} />
            <Route path="review" element={<ReviewQueuePage />} />
            <Route path="export" element={<ExportDossierPage />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
