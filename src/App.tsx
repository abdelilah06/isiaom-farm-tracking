import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicPlot from './pages/PublicPlot';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HomePage from './pages/HomePage';
import Analytics from './pages/Analytics';
import PublicGallery from './pages/PublicGallery';

import { OfflineProvider } from './lib/OfflineContext';
import { OfflineBanner } from './components/OfflineBanner';

function App() {
  return (
    <OfflineProvider>
      <Router>
        <OfflineBanner />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/gallery" element={<PublicGallery />} />
          <Route path="/plot/:id" element={<PublicPlot />} />
          <Route path="/" element={<HomePage />} />

          <Route path="*" element={<div className="p-12 text-center text-gray-500 font-sans" dir="rtl">الصفحة غير موجودة (404)</div>} />
        </Routes>
      </Router>
    </OfflineProvider>
  );
}

export default App;