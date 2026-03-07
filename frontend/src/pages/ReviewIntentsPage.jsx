import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquareHeart, Search, Filter, Clock, CheckCircle2, XCircle, Instagram } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import { reviewIntentsApi } from '../lib/api';
import { formatDateTime, formatRelativeTime } from '../lib/utils';

export default function ReviewIntentsPage() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [mockReviewIntents, setReviewIntents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewIntentsApi.list()
      .then(res => setReviewIntents(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content">Loading...</div>;


  const filtered = mockReviewIntents.filter(ri => {
    if (filter !== 'all' && ri.thankStatus !== filter) return false;
    if (search && !ri.reviewIntentId.includes(search) && !ri.customerIdentityRef?.includes(search)) return false;
    return true;
  });

  const counts = {
    all: mockReviewIntents.length,
    pending: mockReviewIntents.filter(r => r.thankStatus === 'pending').length,
    completed: mockReviewIntents.filter(r => r.thankStatus === 'completed').length,
    expired: mockReviewIntents.filter(r => r.thankStatus === 'expired').length,
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Review Intents</h1>
          <p>Track QR scan → review → voice thank-you lifecycle for each customer interaction.</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-lg)' }}>
        {['all', 'pending', 'completed', 'expired'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
          >
            {f === 'all' && <MessageSquareHeart size={14} />}
            {f === 'pending' && <Clock size={14} />}
            {f === 'completed' && <CheckCircle2 size={14} />}
            {f === 'expired' && <XCircle size={14} />}
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span style={{
              fontSize: '0.6875rem',
              background: filter === f ? 'rgba(255,255,255,0.2)' : 'var(--bg-surface-overlay)',
              padding: '1px 7px',
              borderRadius: 'var(--radius-full)',
              marginLeft: 4,
            }}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 400, marginBottom: 'var(--space-lg)' }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="input"
          placeholder="Search by intent ID or identity ref..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40, width: '100%' }}
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="table-container"
      >
        <table className="table">
          <thead>
            <tr>
              <th>Intent ID</th>
              <th>Customer Ref</th>
              <th>Campaign</th>
              <th>Scanned</th>
              <th>Expires</th>
              <th>Thank Status</th>
              <th>Channel</th>
              <th>Confidence</th>
              <th>Social</th>
              <th>Incentive</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ri, idx) => (
              <motion.tr
                key={ri.reviewIntentId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-brand)' }}>
                  {ri.reviewIntentId}
                </td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                  {ri.customerIdentityRef || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
                <td style={{ fontSize: '0.8125rem' }}>
                  {ri.campaignId.substring(0, 8)}...
                </td>
                <td style={{ fontSize: '0.8125rem' }}>
                  {formatRelativeTime(ri.scanTs)}
                </td>
                <td style={{ fontSize: '0.8125rem' }}>
                  {formatDateTime(ri.expiresAt)}
                </td>
                <td>
                  <StatusBadge status={ri.thankStatus} />
                </td>
                <td>
                  <span className={`badge ${ri.thankChannel !== 'none' ? 'badge-info' : 'badge-neutral'}`}>
                    {ri.thankChannel.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <span className={`badge ${ri.confidence === 'explicit' ? 'badge-success' : ri.confidence === 'soft' ? 'badge-warning' : 'badge-neutral'}`}>
                    {ri.confidence}
                  </span>
                </td>
                <td>
                  {ri.instagramHandle ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-brand)', fontSize: '0.8125rem' }}>
                      <Instagram size={13} />
                      {ri.instagramHandle}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td>
                  {ri.incentiveType ? (
                    <span className="badge badge-success">
                      {ri.incentiveValue}% off
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
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
