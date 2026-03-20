import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import QrCodesPage from './pages/QrCodesPage';
import ReviewIntentsPage from './pages/ReviewIntentsPage';
import ReferralProgramsPage from './pages/ReferralProgramsPage';
import ReferralLinksPage from './pages/ReferralLinksPage';
import WalletsPage from './pages/WalletsPage';
import PayoutsPage from './pages/PayoutsPage';
import FraudQueuePage from './pages/FraudQueuePage';
import AuditLogsPage from './pages/AuditLogsPage';
import SettingsPage from './pages/SettingsPage';
import PublicLandingPage from './pages/PublicLandingPage';
import VoiceThankYouPage from './pages/VoiceThankYouPage';
import IncentivesPage from './pages/IncentivesPage';
import AIEnginePage from './pages/AIEnginePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import AIChatbot from './components/shared/AIChatbot';

// Auth Pages
import UserLoginPage from './pages/auth/UserLoginPage';
import UserRegisterPage from './pages/auth/UserRegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import AdminRegisterPage from './pages/auth/AdminRegisterPage';

function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        marginLeft: 260,
        transition: 'margin-left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}>
        <Header />
        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<UserLoginPage />} />
          <Route path="/register" element={<UserRegisterPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/register" element={<AdminRegisterPage />} />

          {/* Public Customer Routes */}
          <Route path="/r/:code" element={<PublicLandingPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/ai-engine" element={<AIEnginePage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/qr-codes" element={<QrCodesPage />} />
            <Route path="/review-intents" element={<ReviewIntentsPage />} />
            <Route path="/referral-programs" element={<ReferralProgramsPage />} />
            <Route path="/referral-links" element={<ReferralLinksPage />} />
            <Route path="/wallets" element={<WalletsPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            <Route path="/fraud-queue" element={<FraudQueuePage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/voice-thank-you" element={<VoiceThankYouPage />} />
            <Route path="/incentives" element={<IncentivesPage />} />
          </Route>
            </Routes>
            <AIChatbot />
          </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
