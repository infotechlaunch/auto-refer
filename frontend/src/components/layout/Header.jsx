import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, Search, ChevronDown, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const routeTitles = {
  '/': 'Dashboard',
  '/campaigns': 'Campaigns',
  '/campaigns/new': 'Create Campaign',
  '/qr-codes': 'QR Codes',
  '/review-intents': 'Review Intents',
  '/referral-programs': 'Referral Programs',
  '/referral-links': 'Referral Links',
  '/wallets': 'Wallets',
  '/payouts': 'Payouts',
  '/fraud-queue': 'Fraud Queue',
  '/audit-logs': 'Audit Logs',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const title = routeTitles[location.pathname] || 'AutoPilot';
  const { user, logout } = useAuth();
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-xl)',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      {/* Left: Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h2 style={{
          fontSize: '1.125rem',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.01em',
        }}>
          {title}
        </h2>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Search */}
        <button
          className="btn btn-ghost btn-icon"
          title="Search"
          style={{ position: 'relative' }}
          onClick={() => {
            // Optional search trigger
          }}
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className="btn btn-ghost btn-icon"
            title="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={18} />
            <span style={{
              position: 'absolute',
              top: 4,
              right: 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--brand-danger)',
              border: '2px solid var(--bg-root)',
            }} />
          </button>
          
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 300,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Notifications</h3>
                </div>
                <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No new notifications right now.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div style={{
          width: 1,
          height: 24,
          background: 'var(--border-default)',
          margin: '0 8px',
        }} />

        {/* User Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            className="btn btn-ghost"
            style={{ gap: 10, padding: '6px 10px', display: 'flex', alignItems: 'center' }}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'white',
            }}>
              {user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'GU'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name || 'Guest User'}
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {user?.role === 'admin' ? 'Administrator' : 'User'}
              </div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          <AnimatePresence>
            {isUserMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: 220,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  overflow: 'hidden',
                  zIndex: 50,
                }}
              >
                <div style={{ padding: '8px 0' }}>
                  <button
                    onClick={() => { navigate('/settings'); setIsUserMenuOpen(false); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <Settings size={16} />
                    Profile Settings
                  </button>
                  <div style={{ height: 1, background: 'var(--border-subtle)', margin: '4px 0' }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '10px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-danger)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
