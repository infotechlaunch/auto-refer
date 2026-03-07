import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Phone, User, Mail, Instagram, CheckCircle2, ChevronRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { publicApi } from '../lib/api';

/* ─── Inline style helpers ─── */
const S = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 20% 0%, #1e1b4b 0%, #0f172a 55%, #030712 100%)',
    color: 'white',
    padding: '32px 16px 60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  wrap: { maxWidth: 440, width: '100%' },
  logoBox: {
    width: 68, height: 68,
    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
    borderRadius: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 18px',
    boxShadow: '0 12px 28px -6px rgba(99,102,241,0.5)',
  },
  bizName: { fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 6px' },
  tagline: { fontSize: '1rem', color: '#94a3b8', margin: 0 },
  card: {
    background: 'rgba(15,23,42,0.75)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 28,
    padding: '28px 24px',
    border: '1px solid rgba(255,255,255,0.08)',
    boxShadow: '0 30px 60px -15px rgba(0,0,0,0.6)',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: '0.75rem', fontWeight: 700,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: '#64748b', marginBottom: 16,
  },
  fieldWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 },
  labelNote: { fontSize: '0.6875rem', color: '#4ade80', fontWeight: 500, background: 'rgba(74,222,128,0.1)', padding: '1px 6px', borderRadius: 99 },
  inputFn: (focused) => ({
    width: '100%', boxSizing: 'border-box',
    padding: '13px 16px', fontSize: '1rem', fontFamily: 'inherit',
    color: 'white',
    background: focused ? 'rgba(99,102,241,0.09)' : 'rgba(255,255,255,0.05)',
    border: `1.5px solid ${focused ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 14, outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    WebkitAppearance: 'none',
  }),
  inputHint: { fontSize: '0.6875rem', color: '#475569', margin: '3px 0 0', lineHeight: 1.4 },
  consentRow: {
    display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', userSelect: 'none',
    padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
    borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.07)',
  },
  checkBox: (checked) => ({
    width: 22, height: 22, minWidth: 22, borderRadius: 7,
    border: `2px solid ${checked ? '#6366f1' : '#334155'}`,
    background: checked ? '#6366f1' : 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.15s', marginTop: 1,
  }),
  consentText: { fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.55 },
  submitBtn: (disabled) => ({
    width: '100%', height: 56, borderRadius: 16,
    background: disabled ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: disabled ? '#475569' : 'white',
    border: 'none', fontSize: '1rem', fontWeight: 700, fontFamily: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'opacity 0.15s',
    boxShadow: disabled ? 'none' : '0 8px 20px -4px rgba(99,102,241,0.45)',
    letterSpacing: '-0.01em',
  }),
  footerNote: { textAlign: 'center', fontSize: '0.6875rem', color: '#334155', marginTop: 8 },
  errorWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 20 },
  errorCard: { maxWidth: 400, width: '100%', textAlign: 'center', padding: 40, background: '#1e293b', borderRadius: 24, border: '1px solid #334155' },
};

/* ─── Reusable Field wrapper ─── */
function Field({ label, hint, badge, icon: Icon, children }) {
  return (
    <div style={S.fieldWrap}>
      <label style={S.label}>
        <Icon size={14} style={{ color: '#818cf8' }} />
        {label}
        {badge && <span style={S.labelNote}>{badge}</span>}
      </label>
      {children}
      {hint && <p style={S.inputHint}>{hint}</p>}
    </div>
  );
}

/* ─── Input with focus highlight ─── */
function FocusInput({ type = 'text', placeholder, value, onChange, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      style={S.inputFn(focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      autoComplete="on"
    />
  );
}

export default function PublicLandingPage() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', instagramHandle: '', consentGiven: false,
  });

  useEffect(() => {
    publicApi.resolveQr(code)
      .then(res => setSettings(res.data))
      .catch(err => setError(err.message || 'This link is invalid or has expired.'))
      .finally(() => setLoading(false));
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (settings.requireConsent && !formData.consentGiven) {
      alert('Please accept the consent checkbox to continue.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await publicApi.capture({ campaignId: settings.campaignId, ...formData });
      setSuccess(true);
      setTimeout(() => { window.location.href = res.data.redirectUrl; }, 1800);
    } catch (err) {
      alert(err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ ...S.page, alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <Loader2 size={36} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div style={S.errorWrap}>
        <div style={S.errorCard}>
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 20px', display: 'block' }} />
          <h1 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: 12 }}>Link Error</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9375rem', lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
    );
  }

  const hasAnyField = settings.captureName || settings.capturePhone || settings.captureEmail || settings.captureSocial;
  const submitDisabled = submitting || (settings.requireConsent && !formData.consentGiven);

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <AnimatePresence mode="wait">

        {/* ── SUCCESS ── */}
        {success && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', maxWidth: 400, width: '100%', padding: '60px 20px' }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, delay: 0.1 }}
              style={{ width: 90, height: 90, background: 'linear-gradient(135deg,#10b981,#34d399)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 40px rgba(16,185,129,0.35)' }}
            >
              <CheckCircle2 size={44} color="white" />
            </motion.div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 10 }}>Thank You! 🎉</h2>
            <p style={{ color: '#94a3b8', marginBottom: 28, lineHeight: 1.6 }}>
              Redirecting you to leave your review now…
            </p>
            <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#6366f1)' }}
              />
            </div>
          </motion.div>
        )}

        {/* ── FORM ── */}
        {!success && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={S.wrap}
          >
            {/* Brand Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 14, delay: 0.1 }}
                style={S.logoBox}
              >
                <Star fill="white" size={30} />
              </motion.div>
              <h1 style={S.bizName}>{settings.restaurantName}</h1>
              <p style={S.tagline}>We'd love to hear from you!</p>
            </div>

            {/* Form Card */}
            <div style={S.card}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {hasAnyField && <p style={S.sectionTitle}>Your Details</p>}

                {settings.captureName && (
                  <Field label="Your Name" icon={User}>
                    <FocusInput placeholder="e.g. John Doe" value={formData.name} onChange={set('name')} required />
                  </Field>
                )}

                {settings.capturePhone && (
                  <Field label="Phone Number" icon={Phone} badge="AI Voice Call" hint="We'll send a one-time AI thank-you call to this number.">
                    <FocusInput type="tel" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={set('phone')} required />
                  </Field>
                )}

                {settings.captureEmail && (
                  <Field label="Email Address" icon={Mail}>
                    <FocusInput type="email" placeholder="you@example.com" value={formData.email} onChange={set('email')} required />
                  </Field>
                )}

                {settings.captureSocial && (
                  <Field label="Instagram / TikTok / Facebook" icon={Instagram} hint="Optional — your handle or profile link.">
                    <FocusInput placeholder="@username or profile URL" value={formData.instagramHandle} onChange={set('instagramHandle')} />
                  </Field>
                )}

                {settings.requireConsent && (
                  <>
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    <div style={S.consentRow} onClick={() => setFormData(prev => ({ ...prev, consentGiven: !prev.consentGiven }))}>
                      <div style={S.checkBox(formData.consentGiven)}>
                        {formData.consentGiven && <CheckCircle2 size={13} color="white" />}
                      </div>
                      <span style={S.consentText}>
                        I agree to receive a one-time AI thank-you call and exclusive future rewards from{' '}
                        <strong style={{ color: '#cbd5e1' }}>{settings.restaurantName}</strong>.
                      </span>
                    </div>
                  </>
                )}

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

                <button type="submit" disabled={submitDisabled} style={S.submitBtn(submitDisabled)}>
                  {submitting
                    ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</>
                    : <><ChevronRight size={18} /> Continue to Review</>
                  }
                </button>
              </form>
            </div>

            {/* Trust footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
              <ShieldCheck size={13} style={{ color: '#334155' }} />
              <span style={S.footerNote}>Your data is encrypted &amp; never sold.</span>
            </div>
            <p style={S.footerNote}>Built with ITL AutoRefer™</p>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}



