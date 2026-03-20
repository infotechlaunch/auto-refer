import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings, Shield, PowerOff, Save, AlertTriangle, Globe,
  Bell, Database, Zap, Check, X, Loader2, RefreshCw,
  Eye, EyeOff,
} from 'lucide-react';
import { settingsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Toast ─────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { bg: 'var(--brand-primary)', icon: <Check size={14} /> },
    error:   { bg: '#ef4444',             icon: <X size={14} /> },
    info:    { bg: '#6366f1',             icon: <RefreshCw size={14} /> },
  };
  const c = colors[type] || colors.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 18px', borderRadius: 10,
        background: c.bg, color: '#fff',
        fontSize: '0.85rem', fontWeight: 500,
        boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
        maxWidth: 360,
      }}
    >
      {c.icon}
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{ marginLeft: 8, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
      >
        <X size={13} />
      </button>
    </motion.div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function SettingSection({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card"
      style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-lg)' }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}>
        <Icon size={18} style={{ color: 'var(--brand-primary-light)' }} />
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </motion.div>
  );
}

// ─── Toggle Row ─────────────────────────────────────────────────────────────
function ToggleRow({ label, description, checked, onChange, disabled = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ flex: 1, marginRight: 16 }}>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: disabled ? 'var(--text-muted)' : 'var(--text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div
        className="toggle-track"
        data-active={String(!!checked)}
        onClick={() => !disabled && onChange(!checked)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', flexShrink: 0 }}
      >
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

// ─── Secret Input ──────────────────────────────────────────────────────────
function SecretInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <label>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          className="input"
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ paddingRight: 44 }}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            position: 'absolute', right: 10,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-muted)', padding: 0, display: 'flex', alignItems: 'center',
          }}
          title={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

// ─── Danger Button ─────────────────────────────────────────────────────────
function DangerButton({ icon: Icon, label, onClick, loading }) {
  return (
    <button
      className="btn btn-danger"
      onClick={onClick}
      disabled={loading}
      style={{ opacity: loading ? 0.7 : 1 }}
    >
      {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon size={14} />}
      {label}
    </button>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [dangerLoading, setDangerLoading] = useState({ freeze: false, purge: false });
  const [confirmAction, setConfirmAction] = useState(null); // { type, label, fn }

  // ── Settings State ─────────────────────────────────────────────────────
  const [settings, setSettings] = useState({
    system_enabled: true,
    autoreferrer_engine_enabled: true,
    voice_linkage_enabled: true,
    incentive_delivery_enabled: true,

    device_fingerprinting_enabled: true,
    ip_velocity_detection_enabled: true,
    self_referral_blocking_enabled: true,
    disposable_email_detection_enabled: true,
    auto_block_threshold: 90,
    hold_review_threshold: 50,

    fraud_alert_emails_enabled: true,
    payout_request_notifications_enabled: true,
    daily_summary_digest_enabled: false,

    stripe_webhook_secret: '',
    zapier_webhook_url: '',
    google_places_api_key: '',
  });

  const showToast = (message, type = 'success') => setToast({ message, type });

  // ── Load settings on mount ─────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await settingsApi.get();
      if (res.success && res.data) {
        setSettings(prev => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      showToast(err.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ── Save settings ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.update(settings);
      showToast('Settings saved successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Field helpers ─────────────────────────────────────────────────────
  const set = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }));
  const setNum = (key) => (e) => setSettings(prev => ({ ...prev, [key]: Number(e.target.value) }));
  const setStr = (key) => (val) => setSettings(prev => ({ ...prev, [key]: val }));

  // ── Danger zone actions ────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!confirmAction) return;
    const { type, fn } = confirmAction;
    setDangerLoading(prev => ({ ...prev, [type]: true }));
    setConfirmAction(null);
    try {
      const res = await fn();
      showToast(res.message || 'Action completed.', 'success');
    } catch (err) {
      showToast(err.message || 'Action failed.', 'error');
    } finally {
      setDangerLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
          <p style={{ fontSize: '0.875rem' }}>Loading settings…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>System-wide configuration and kill switches for AutoRefer™ services.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ opacity: saving ? 0.75 : 1 }}
        >
          {saving
            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            : <Save size={16} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* ── System Controls ── */}
      <SettingSection title="System Controls" icon={Zap} delay={0.05}>
        <ToggleRow
          label="AutoRefer™ System"
          description="Master kill switch — disables all QR review and voice thank-you flows."
          checked={settings.system_enabled}
          onChange={set('system_enabled')}
        />
        <ToggleRow
          label="AutoRefer™ Engine"
          description="Kill switch for the referral program. Disabling halts new signups, link generation, and reward processing."
          checked={settings.autoreferrer_engine_enabled}
          onChange={set('autoreferrer_engine_enabled')}
        />
        <ToggleRow
          label="Voice Linkage"
          description="Enable AI voice recognition for inbound call thank-yous."
          checked={settings.voice_linkage_enabled}
          onChange={set('voice_linkage_enabled')}
        />
        <ToggleRow
          label="Incentive Delivery"
          description="Enable automatic incentive coupon delivery upon review completion."
          checked={settings.incentive_delivery_enabled}
          onChange={set('incentive_delivery_enabled')}
        />
      </SettingSection>

      {/* ── Fraud Prevention ── */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <SettingSection title="Fraud Prevention" icon={Shield} delay={0.1}>
          <ToggleRow
            label="Device Fingerprinting"
            description="Block duplicate referral clicks from the same device."
            checked={settings.device_fingerprinting_enabled}
            onChange={set('device_fingerprinting_enabled')}
          />
          <ToggleRow
            label="IP Velocity Detection"
            description="Flag IPs with more than 5 referral clicks in 24 hours."
            checked={settings.ip_velocity_detection_enabled}
            onChange={set('ip_velocity_detection_enabled')}
          />
          <ToggleRow
            label="Self-Referral Blocking"
            description="Detect and block referrals between accounts owned by the same entity."
            checked={settings.self_referral_blocking_enabled}
            onChange={set('self_referral_blocking_enabled')}
          />
          <ToggleRow
            label="Disposable Email Detection"
            description="Flag signups using known disposable email domains."
            checked={settings.disposable_email_detection_enabled}
            onChange={set('disposable_email_detection_enabled')}
          />
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Auto-Block Threshold</label>
              <input
                className="input"
                type="number"
                min={0} max={100}
                value={settings.auto_block_threshold}
                onChange={setNum('auto_block_threshold')}
              />
            </div>
            <div className="input-group">
              <label>Hold / Review Threshold</label>
              <input
                className="input"
                type="number"
                min={0} max={100}
                value={settings.hold_review_threshold}
                onChange={setNum('hold_review_threshold')}
              />
            </div>
          </div>
        </SettingSection>
      )}

      {/* ── Notifications ── */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <SettingSection title="Notifications" icon={Bell} delay={0.15}>
          <ToggleRow
            label="Fraud Alert Emails"
            description="Send email to admin when fraud score exceeds block threshold."
            checked={settings.fraud_alert_emails_enabled}
            onChange={set('fraud_alert_emails_enabled')}
          />
          <ToggleRow
            label="Payout Request Notifications"
            description="Notify admin when new payout requests are submitted."
            checked={settings.payout_request_notifications_enabled}
            onChange={set('payout_request_notifications_enabled')}
          />
          <ToggleRow
            label="Daily Summary Digest"
            description="Daily email summarizing scans, intents, referrals, and payouts."
            checked={settings.daily_summary_digest_enabled}
            onChange={set('daily_summary_digest_enabled')}
          />
        </SettingSection>
      )}

      {/* ── API & Integrations ── */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <SettingSection title="API & Integrations" icon={Globe} delay={0.2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <SecretInput
              label="Stripe Webhook Secret"
              value={settings.stripe_webhook_secret}
              onChange={setStr('stripe_webhook_secret')}
              placeholder="whsec_••••••••••••••••••••"
            />
            <div className="input-group">
              <label>Zapier Webhook URL</label>
              <input
                className="input"
                type="url"
                value={settings.zapier_webhook_url}
                onChange={e => setStr('zapier_webhook_url')(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
            </div>
            <SecretInput
              label="Google Places API Key"
              value={settings.google_places_api_key}
              onChange={setStr('google_places_api_key')}
              placeholder="AIza•••••••••••••"
            />
          </div>
        </SettingSection>
      )}

      {/* ── Danger Zone ── */}
      {(user?.role === 'admin' || user?.role === 'super_admin') && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: '20px',
            background: 'rgba(239, 68, 68, 0.04)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-lg)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={18} style={{ color: 'var(--text-danger)' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-danger)' }}>Danger Zone</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
            These are irreversible bulk operations. Proceed with caution.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <DangerButton
              icon={PowerOff}
              label="Freeze All Wallets"
              loading={dangerLoading.freeze}
              onClick={() => setConfirmAction({
                type: 'freeze',
                label: 'Freeze All Wallets',
                description: 'This will freeze every active referral wallet in this tenant. Payouts will be blocked until wallets are manually unfrozen.',
                fn: settingsApi.freezeWallets,
              })}
            />
            <DangerButton
              icon={Database}
              label="Purge Expired Intents"
              loading={dangerLoading.purge}
              onClick={() => setConfirmAction({
                type: 'purge',
                label: 'Purge Expired Intents',
                description: 'This will permanently delete all review intents with status "expired" from the database. This cannot be undone.',
                fn: settingsApi.purgeExpiredIntents,
              })}
            />
          </div>
        </motion.div>
      )}

      {/* ── Confirmation Modal ── */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)',
                padding: '28px', maxWidth: 440, width: '100%',
                border: '1px solid rgba(239,68,68,0.25)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confirm: {confirmAction.label}
                </h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                {confirmAction.description}
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setConfirmAction(null)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleConfirm}>
                  <AlertTriangle size={14} />
                  Yes, proceed
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Notification ── */}
      <AnimatePresence>
        {toast && (
          <Toast
            key={toast.message}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
