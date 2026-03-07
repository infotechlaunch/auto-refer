import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function AdminRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', accessKey: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.accessKey) {
      setError('Admin Access Key is required.');
      return;
    }
    setLoading(true);
    const result = await register(formData.name, formData.email, formData.password, 'admin');
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed.');
    }
  };

  return (
    <AuthLayout 
      layout="card"
      type="admin" 
      title="Admin Registration" 
      subtitle="Restricted access. Validation required."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Error Message */}
        {error && (
          <div className="auth-error" id="admin-register-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {error}
          </div>
        )}

        <div className="auth-fields">
          {/* Full Name */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="admin-reg-name">Full Name</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                id="admin-reg-name"
                type="text"
                name="name"
                required
                className="auth-input auth-input-padded"
                placeholder="Admin Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Admin Email */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="admin-reg-email">Admin Email</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94" />
                </svg>
              </div>
              <input
                id="admin-reg-email"
                type="email"
                name="email"
                required
                className="auth-input auth-input-padded"
                placeholder="admin@autorefer.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="admin-reg-password">Password</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <input
                id="admin-reg-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                className="auth-input auth-input-padded auth-input-password"
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

          {/* Access Key */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="admin-reg-key">Access Key</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </div>
              <input
                id="admin-reg-key"
                type="password"
                name="accessKey"
                required
                className="auth-input auth-input-padded"
                placeholder="Required for admin registration"
                value={formData.accessKey}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          id="admin-register-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <div className="auth-spinner" />
          ) : (
            <>
              Request Access
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </>
          )}
        </button>

        <div className="auth-footer-link">
          <span>Have an account?</span>
          <Link to="/admin/login" className="auth-link" id="admin-signin-link">
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
