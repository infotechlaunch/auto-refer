import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Power, PowerOff, Save, AlertTriangle, Globe, Bell, Database, Zap } from 'lucide-react';

function SettingSection({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
      style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--space-lg)' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
      }}>
        <Icon size={18} style={{ color: 'var(--brand-primary-light)' }} />
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      </div>
      <div style={{ padding: '20px' }}>
        {children}
      </div>
    </motion.div>
  );
}

function ToggleRow({ label, description, defaultChecked = false }) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <div
        className="toggle-track"
        data-active={String(checked)}
        onClick={() => setChecked(!checked)}
      >
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>System-wide configuration and kill switches for AutoRefer™ services.</p>
        </div>
        <button className="btn btn-primary">
          <Save size={16} />
          Save Changes
        </button>
      </div>

      {/* System Controls */}
      <SettingSection title="System Controls" icon={Zap}>
        <ToggleRow
          label="AutoRefer™ System"
          description="Master kill switch — disables all QR review and voice thank-you flows."
          defaultChecked={true}
        />
        <ToggleRow
          label="AutoRefer™ Engine"
          description="Kill switch for the referral program. Disabling halts new signups, link generation, and reward processing."
          defaultChecked={true}
        />
        <ToggleRow
          label="Voice Linkage"
          description="Enable AI voice recognition for inbound call thank-yous."
          defaultChecked={true}
        />
        <ToggleRow
          label="Incentive Delivery"
          description="Enable automatic incentive coupon delivery upon review completion."
          defaultChecked={true}
        />
      </SettingSection>

      {/* Fraud Configuration */}
      <SettingSection title="Fraud Prevention" icon={Shield}>
        <ToggleRow
          label="Device Fingerprinting"
          description="Block duplicate referral clicks from the same device."
          defaultChecked={true}
        />
        <ToggleRow
          label="IP Velocity Detection"
          description="Flag IPs with more than 5 referral clicks in 24 hours."
          defaultChecked={true}
        />
        <ToggleRow
          label="Self-Referral Blocking"
          description="Detect and block referrals between accounts owned by the same entity."
          defaultChecked={true}
        />
        <ToggleRow
          label="Disposable Email Detection"
          description="Flag signups using known disposable email domains."
          defaultChecked={true}
        />
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Auto-Block Threshold</label>
            <input className="input" type="number" defaultValue={90} />
          </div>
          <div className="input-group">
            <label>Hold/Review Threshold</label>
            <input className="input" type="number" defaultValue={50} />
          </div>
        </div>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifications" icon={Bell}>
        <ToggleRow
          label="Fraud Alert Emails"
          description="Send email to admin when fraud score exceeds block threshold."
          defaultChecked={true}
        />
        <ToggleRow
          label="Payout Request Notifications"
          description="Notify admin when new payout requests are submitted."
          defaultChecked={true}
        />
        <ToggleRow
          label="Daily Summary Digest"
          description="Daily email summarizing scans, intents, referrals, and payouts."
          defaultChecked={false}
        />
      </SettingSection>

      {/* API Configuration */}
      <SettingSection title="API & Integrations" icon={Globe}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Stripe Webhook Secret</label>
            <input className="input" type="password" defaultValue="whsec_•••••••••••••••••••" />
          </div>
          <div className="input-group">
            <label>Zapier Webhook URL</label>
            <input className="input" placeholder="https://hooks.zapier.com/hooks/catch/..." />
          </div>
          <div className="input-group">
            <label>Google Places API Key</label>
            <input className="input" type="password" defaultValue="AIza•••••••••••••" />
          </div>
        </div>
      </SettingSection>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '20px',
          background: 'rgba(239, 68, 68, 0.04)',
          border: '1px solid rgba(239, 68, 68, 0.15)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={18} style={{ color: 'var(--text-danger)' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-danger)' }}>Danger Zone</h3>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-danger">
            <PowerOff size={14} />
            Freeze All Wallets
          </button>
          <button className="btn btn-danger">
            <Database size={14} />
            Purge Expired Intents
          </button>
        </div>
      </motion.div>
    </div>
  );
}
