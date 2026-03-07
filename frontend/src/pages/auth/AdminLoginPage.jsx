import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please provide administrative credentials.');
      return;
    }
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <AuthLayout
      layout="split"
      title="Admin Portal"
      subtitle="Secure access for system administrators."
    >
      {/* Divider */}
      <div className="auth-divider">
        <div className="auth-divider-line" />
        <span className="auth-divider-text">ENTER ADMIN CREDENTIALS</span>
        <div className="auth-divider-line" />
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Error Message */}
        {error && (
          <div className="auth-error" id="admin-login-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </div>
        )}

        <div className="auth-fields">
          {/* Email */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="admin-email">Admin Email</label>
            <div className="auth-input-wrapper">
              <input
                id="admin-email"
                type="email"
                name="email"
                required
                className="auth-input"
                placeholder="admin@autorefer.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <div className="auth-label-row">
              <label className="auth-label" htmlFor="admin-password">Password</label>
              <a href="#" className="auth-forgot-link">Forgot Password?</a>
            </div>
            <div className="auth-input-wrapper">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                className="auth-input auth-input-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          id="admin-login-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <div className="auth-spinner" />
          ) : (
            'Access Portal'
          )}
        </button>

        <div className="auth-footer-link">
          <span>Need admin access?</span>
          <Link to="/admin/register" className="auth-link" id="admin-request-link">
            Request account
          </Link>
        </div>

        {/* Security Badge */}
        <div className="auth-security-badge" id="admin-security-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span>SECURE 256-BIT SSL ENCRYPTION</span>
        </div>
      </form>
    </AuthLayout>
  );
}
