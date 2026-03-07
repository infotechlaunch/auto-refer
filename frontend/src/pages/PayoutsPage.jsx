import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, X, Clock, DollarSign, ArrowUpRight } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import { payoutsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDateTime } from '../lib/utils';

function MethodBadge({ method }) {
  const map = {
    stripe_connect: { label: 'Stripe Connect', color: '#6366f1' },
    ach: { label: 'Bank ACH', color: '#06b6d4' },
    manual: { label: 'Manual', color: '#f59e0b' },
  };
  const m = map[method] || { label: method, color: '#94a3b8' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      fontSize: '0.6875rem',
      fontWeight: 600,
      borderRadius: 'var(--radius-full)',
      background: `${m.color}18`,
      color: m.color,
      border: `1px solid ${m.color}30`,
    }}>
      <CreditCard size={10} />
      {m.label}
    </span>
  );
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchData = () => {
    setLoading(true);
    payoutsApi.list()
      .then(res => setPayouts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this payout request?')) return;
    try {
      await payoutsApi.approve(id);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await payoutsApi.reject(id, reason);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleMarkPaid = async (id) => {
    if (!window.confirm('Mark this payout as completed/paid?')) return;
    try {
      await payoutsApi.markPaid(id);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  if (loading) return <div className="page-content">Loading...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Payout Requests</h1>
          <p>Review, approve, and process referral reward payouts.</p>
        </div>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)', flexWrap: 'wrap' }}>
        {[
          { label: 'Requested', count: payouts.filter(p => p.status === 'requested').length, color: 'var(--brand-warning)' },
          { label: 'Approved', count: payouts.filter(p => p.status === 'approved').length, color: 'var(--brand-info)' },
          { label: 'Paid', count: payouts.filter(p => p.status === 'paid').length, color: 'var(--brand-success)' },
          { label: 'Rejected', count: payouts.filter(p => p.status === 'rejected').length, color: 'var(--brand-danger)' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: '10px 20px',
            background: 'var(--bg-surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: s.color,
            }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* Payout Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="table-container"
      >
        <table className="table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((payout, idx) => (
              <motion.tr
                key={payout.payoutRequestId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
              >
                <td>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {payout.ownerName}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {payout.ownerId}
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(payout.amount)}
                  </span>
                </td>
                <td>
                  <MethodBadge method={payout.method} />
                </td>
                <td>
                  <StatusBadge status={payout.status} />
                </td>
                <td style={{ fontSize: '0.8125rem' }}>
                  {formatDateTime(payout.createdAt)}
                </td>
                <td>
                  {isAdmin && payout.status === 'requested' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(payout.payoutRequestId)}>
                        <Check size={13} />
                        Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleReject(payout.payoutRequestId)}>
                        <X size={13} />
                        Reject
                      </button>
                    </div>
                  )}
                  {isAdmin && payout.status === 'approved' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleMarkPaid(payout.payoutRequestId)}>
                      <ArrowUpRight size={13} />
                      Process (Paid)
                    </button>
                  )}
                  {(!isAdmin || ['paid', 'rejected'].includes(payout.status)) && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
