import { motion } from 'framer-motion';
import { FileText, Search, Filter, User, Settings, Shield, Wallet, Share2, Megaphone } from 'lucide-react';
import { auditLogsApi } from '../lib/api';
import { formatRelativeTime, formatDateTime } from '../lib/utils';
import { useState, useEffect } from 'react';

function ActionIcon({ action }) {
  if (action.includes('campaign')) return <Megaphone size={14} />;
  if (action.includes('wallet') || action.includes('payout')) return <Wallet size={14} />;
  if (action.includes('fraud')) return <Shield size={14} />;
  if (action.includes('referral')) return <Share2 size={14} />;
  return <Settings size={14} />;
}

function ActionBadge({ action }) {
  const color = action.includes('fraud') || action.includes('frozen')
    ? 'badge-danger'
    : action.includes('approved') || action.includes('released')
      ? 'badge-success'
      : 'badge-info';

  return (
    <span className={`badge ${color}`}>
      <ActionIcon action={action} />
      {action.replace(/\./g, ' · ')}
    </span>
  );
}

export default function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [mockAuditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditLogsApi.list()
      .then(res => setAuditLogs(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content">Loading...</div>;

  const filtered = mockAuditLogs.filter(l =>
    !search ||
    l.action.includes(search.toLowerCase()) ||
    l.actor.includes(search.toLowerCase()) ||
    l.detail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Audit Logs</h1>
          <p>Complete audit trail — who changed what, when. Critical for compliance and debugging.</p>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-lg)' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Search by action, actor, or detail..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40, width: '100%' }}
        />
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute',
          left: 20,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'var(--border-subtle)',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((log, idx) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              style={{
                display: 'flex',
                gap: 16,
                padding: '14px 0',
                marginLeft: 0,
              }}
            >
              {/* Dot */}
              <div style={{
                width: 42,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                flexShrink: 0,
                position: 'relative',
              }}>
                <div style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: log.actor === 'system' ? 'var(--brand-secondary)' : 'var(--brand-primary)',
                  border: '3px solid var(--bg-root)',
                  zIndex: 1,
                }} />
              </div>

              {/* Content Card */}
              <div style={{
                flex: 1,
                padding: '14px 18px',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                transition: 'border-color 150ms ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <ActionBadge action={log.action} />
                  <span style={{
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: log.actor === 'system' ? 'var(--brand-secondary)' : 'var(--text-brand)',
                  }}>
                    {log.actor === 'system' ? <Settings size={11} /> : <User size={11} />}
                    {log.actor}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>·</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(log.ts)}
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {log.detail}
                </div>
                <div style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  marginTop: 6,
                }}>
                  Target: {log.target} · {formatDateTime(log.ts)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
