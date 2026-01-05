import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicPlot from './pages/PublicPlot';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';
import Analytics from './pages/Analytics';
import PublicGallery from './pages/PublicGallery';
import ChangePassword from './pages/ChangePassword';
import Settings from './pages/Settings';

import { OfflineProvider } from './lib/OfflineContext';
import { OfflineBanner } from './components/OfflineBanner';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './contexts/ThemeContext';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OfflineProvider>
          <Router>
            <OfflineBanner />
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />

              {/* Public Routes */}
              <Route path="/gallery" element={<PublicGallery />} />
              <Route path="/plot/:id" element={<PublicPlot />} />
              <Route path="/" element={<HomePage />} />

              <Route path="*" element={<div className="p-12 text-center text-gray-500 font-sans" dir="rtl">الصفحة غير موجودة (404)</div>} />
            </Routes>
          </Router>
        </OfflineProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;