import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Layout components (Load these normally as they're used in most pages)
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import AIChatbot from './components/shared/AIChatbot';

// Lazy load page components
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const QrCodesPage = lazy(() => import('./pages/QrCodesPage'));
const ReviewIntentsPage = lazy(() => import('./pages/ReviewIntentsPage'));
const ReferralProgramsPage = lazy(() => import('./pages/ReferralProgramsPage'));
const ReferralLinksPage = lazy(() => import('./pages/ReferralLinksPage'));
const WalletsPage = lazy(() => import('./pages/WalletsPage'));
const PayoutsPage = lazy(() => import('./pages/PayoutsPage'));
const FraudQueuePage = lazy(() => import('./pages/FraudQueuePage'));
const AuditLogsPage = lazy(() => import('./pages/AuditLogsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const PublicLandingPage = lazy(() => import('./pages/PublicLandingPage'));
const VoiceThankYouPage = lazy(() => import('./pages/VoiceThankYouPage'));
const IncentivesPage = lazy(() => import('./pages/IncentivesPage'));
const AIEnginePage = lazy(() => import('./pages/AIEnginePage'));

// Auth Pages
const UserLoginPage = lazy(() => import('./pages/auth/UserLoginPage'));
const UserRegisterPage = lazy(() => import('./pages/auth/UserRegisterPage'));
const AdminLoginPage = lazy(() => import('./pages/auth/AdminLoginPage'));
const AdminRegisterPage = lazy(() => import('./pages/auth/AdminRegisterPage'));

function LoadingFallback() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Loading ITL AutoPilot...</p>
    </div>
  );
}

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
          <Suspense fallback={<LoadingFallback />}>
            {children}
          </Suspense>
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
          <Suspense fallback={<LoadingFallback />}>
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
          </Suspense>
          <AIChatbot />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}


export default App;
