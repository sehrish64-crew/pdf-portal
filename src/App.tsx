import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';

const NewReport = lazy(() => import('./pages/NewReport').then((module) => ({ default: module.NewReport })));
const SavedReports = lazy(() => import('./pages/SavedReports').then((module) => ({ default: module.SavedReports })));
const ReportEditor = lazy(() => import('./pages/ReportEditor').then((module) => ({ default: module.ReportEditor })));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        <span className="text-sm font-medium">Loading page…</span>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<NewReport />} />
        <Route path="/reports" element={<SavedReports />} />
        <Route path="/report/:id" element={<ReportEditor />} />
        <Route path="/auth" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRoutes />
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
