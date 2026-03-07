import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters including a number and symbol.');
      return;
    }
    setLoading(true);
    const result = await register(formData.name, formData.email, formData.password);
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
      type="user"
      title="Create your account"
      subtitle="Join the future of automated growth with ITL AutoRefer."
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {/* Error Message */}
        {error && (
          <div className="auth-error" id="register-error-message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="auth-fields">
          {/* Business Name */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-business">Business Name</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                </svg>
              </div>
              <input
                id="reg-business"
                type="text"
                name="businessName"
                className="auth-input auth-input-padded"
                placeholder="Enter your company name"
                value={formData.businessName}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-name">Full Name</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <input
                id="reg-name"
                type="text"
                name="name"
                required
                className="auth-input auth-input-padded"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Work Email */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-email">Work Email</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
              </div>
              <input
                id="reg-email"
                type="email"
                name="email"
                required
                className="auth-input auth-input-padded"
                placeholder="jane@company.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label className="auth-label" htmlFor="reg-password">Password</label>
            <div className="auth-input-wrapper auth-input-with-icon">
              <div className="auth-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <input
                id="reg-password"
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
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
            <span className="auth-hint">Must be at least 8 characters including a number and symbol.</span>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="auth-checkbox-row">
          <input
            type="checkbox"
            id="reg-terms"
            className="auth-checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          <label htmlFor="reg-terms" className="auth-checkbox-label">
            I agree to the <a href="#" className="auth-link">Terms of Service</a> and <a href="#" className="auth-link">Privacy Policy</a>.
          </label>
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          id="register-submit-btn"
          disabled={loading}
        >
          {loading ? (
            <div className="auth-spinner" />
          ) : (
            <>
              Create Account
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>

        <div className="auth-footer-link">
          <span>Already have an account?</span>
          <Link to="/login" className="auth-link" id="signin-link">
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
