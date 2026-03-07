import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, ShieldAlert, ShieldCheck, ShieldX, Check, Snowflake, ArrowRight, Eye } from 'lucide-react';
import { fraudQueueApi } from '../lib/api';
import { formatRelativeTime } from '../lib/utils';

function ScoreIndicator({ score }) {
  const getColor = (s) => {
    if (s >= 90) return 'var(--brand-danger)';
    if (s >= 50) return 'var(--brand-warning)';
    return 'var(--brand-success)';
  };

  const getLabel = (s) => {
    if (s >= 90) return 'BLOCK';
    if (s >= 50) return 'REVIEW';
    return 'ALLOW';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: `3px solid ${getColor(score)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${getColor(score)}12`,
      }}>
        <span style={{
          fontSize: '0.9375rem',
          fontWeight: 800,
          color: getColor(score),
        }}>
          {score}
        </span>
      </div>
      <span style={{
        fontSize: '0.6875rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: getColor(score),
      }}>
        {getLabel(score)}
      </span>
    </div>
  );
}

export default function FraudQueuePage() {
  const [filter, setFilter] = useState('open');
  const [mockFraudQueue, setFraudQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fraudQueueApi.list()
      .then(res => setFraudQueue(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content">Loading...</div>;

  const filtered = mockFraudQueue.filter(f => {
    if (filter === 'open') return !f.resolved;
    if (filter === 'resolved') return f.resolved;
    return true;
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>
            <Shield size={24} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--brand-danger)' }} />
            Fraud Queue
          </h1>
          <p>Review flagged referrals, investigate fraud signals, and take action.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-xl)' }}>
        {['open', 'resolved', 'all'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
          >
            {f === 'open' && <ShieldAlert size={14} />}
            {f === 'resolved' && <ShieldCheck size={14} />}
            {f === 'all' && <Shield size={14} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{
              fontSize: '0.6875rem',
              background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-overlay)',
              padding: '1px 7px',
              borderRadius: 'var(--radius-full)',
            }}>
              {mockFraudQueue.filter(item => {
                if (f === 'open') return !item.resolved;
                if (f === 'resolved') return item.resolved;
                return true;
              }).length}
            </span>
          </button>
        ))}
      </div>

      {/* Fraud Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {filtered.map((item, idx) => (
          <motion.div
            key={item.signalId}
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            style={{
              padding: '24px',
              borderLeft: `4px solid ${item.totalScore >= 90 ? 'var(--brand-danger)' : item.totalScore >= 50 ? 'var(--brand-warning)' : 'var(--brand-success)'}`,
            }}
          >
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              {/* Score */}
              <ScoreIndicator score={item.totalScore} />

              {/* Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.referredName}
                  </h3>
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    referred by <strong>{item.referrerName}</strong>
                  </span>
                  {item.resolved && (
                    <span className="badge badge-success">Resolved</span>
                  )}
                </div>

                {/* Flags */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {item.flags.map((flag, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 14px',
                        background: item.totalScore >= 90 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        border: `1px solid ${item.totalScore >= 90 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
                        borderRadius: 'var(--radius-md)',
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: item.totalScore >= 90 ? 'var(--text-danger)' : 'var(--text-warning)', marginBottom: 2 }}>
                        {flag.type.replace(/_/g, ' ')} (+{flag.weight})
                      </div>
                      {flag.detail && (
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                          {flag.detail}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Detected {formatRelativeTime(item.createdAt)} · Referral {item.referralId}
                </div>
              </div>

              {/* Actions */}
              {!item.resolved && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button className="btn btn-success btn-sm">
                    <ShieldCheck size={13} />
                    Allow
                  </button>
                  <button className="btn btn-danger btn-sm">
                    <Snowflake size={13} />
                    Block & Freeze
                  </button>
                  <button className="btn btn-ghost btn-sm">
                    <Eye size={13} />
                    Investigate
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
