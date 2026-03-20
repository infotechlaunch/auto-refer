import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, Plus, Send, CheckCircle2, Clock, XCircle,
  Search, AlertCircle, X, Percent, DollarSign, Package,
  MessageSquare, Mail, Hand, Zap,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import Modal from '../components/shared/Modal';
import { incentivesApi, campaignsApi } from '../lib/api';
import { formatDateTime, formatReadable } from '../lib/utils';

const TYPE_META = {
  percent: { icon: Percent,    label: 'Percent Off',  color: 'badge-info',    eg: '10' },
  fixed:   { icon: DollarSign, label: 'Fixed Amount', color: 'badge-success', eg: '5.00' },
  freebie: { icon: Package,    label: 'Free Item',    color: 'badge-warning', eg: 'Free coffee' },
};

const METHOD_META = {
  sms:    { icon: MessageSquare, label: 'SMS',    color: '#25D366' },
  email:  { icon: Mail,          label: 'Email',  color: 'var(--brand-info)' },
  manual: { icon: Hand,          label: 'Manual', color: 'var(--text-muted)' },
  auto:   { icon: Zap,           label: 'Auto',   color: 'var(--brand-warning)' },
};

const STATUS_COLOR = {
  pending:  'badge-warning',
  sent:     'badge-info',
  redeemed: 'badge-success',
  expired:  'badge-neutral',
};

const EMPTY_FORM = {
  campaignId: '', customerName: '', customerPhone: '', customerEmail: '',
  incentiveType: 'percent', incentiveValue: '', sendMethod: 'manual', notes: '',
};

export default function IncentivesPage() {
  const [incentives, setIncentives] = useState([]);
  const [stats, setStats]           = useState({ total: 0, pending: 0, sent: 0, redeemed: 0, expired: 0 });
  const [campaigns, setCampaigns]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Modals
  const [showCreate, setShowCreate]     = useState(false);
  const [showSend, setShowSend]         = useState(null);   // incentive object
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [enablingIncentives, setEnablingIncentives] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (filterStatus)   params.status      = filterStatus;
    if (filterCampaign) params.campaign_id  = filterCampaign;

    Promise.all([incentivesApi.list(params), campaignsApi.list()])
      .then(([incRes, campRes]) => {
        setIncentives(incRes.data || []);
        setStats(incRes.stats || {});
        setCampaigns(campRes.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterStatus, filterCampaign]);

  const filtered = useMemo(() => {
    if (!search) return incentives;
    const q = search.toLowerCase();
    return incentives.filter(i =>
      (i.customerName || '').toLowerCase().includes(q) ||
      (i.incentiveValue || '').toLowerCase().includes(q) ||
      (i.campaignName || '').toLowerCase().includes(q)
    );
  }, [incentives, search]);

  // ── Enable Incentives on a Campaign inline ──
  const handleEnableIncentives = async (campaignId) => {
    setEnablingIncentives(true);
    try {
      await campaignsApi.update(campaignId, { enableIncentives: true });
      // Refresh campaigns so the dropdown updates
      const campRes = await campaignsApi.list();
      setCampaigns(campRes.data || []);
    } catch (err) {
      alert(err.message || 'Failed to enable incentives for this campaign');
    } finally {
      setEnablingIncentives(false);
    }
  };

  // ── Create ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await incentivesApi.create(formData);
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create incentive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Send ──
  const handleSend = async (inc, method) => {
    setIsSubmitting(true);
    try {
      await incentivesApi.send(inc.incentiveId, method);
      setShowSend(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to send incentive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Redeem ──
  const handleRedeem = async (inc) => {
    if (!window.confirm(`Mark "${inc.incentiveValue}" as redeemed for ${inc.customerName || 'this customer'}?`)) return;
    try {
      await incentivesApi.redeem(inc.incentiveId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to redeem');
    }
  };

  // ── Expire ──
  const handleExpire = async (inc) => {
    if (!window.confirm(`Expire this incentive for ${inc.customerName || 'this customer'}?`)) return;
    try {
      await incentivesApi.expire(inc.incentiveId);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to expire');
    }
  };

  const getIncentiveLabel = (inc) => {
    if (inc.incentiveType === 'percent') return `${inc.incentiveValue}% off`;
    if (inc.incentiveType === 'fixed')   return `$${parseFloat(inc.incentiveValue).toFixed(2)} off`;
    return inc.incentiveValue;
  };

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Gift size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
        <div>Loading incentives…</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="page-content">
      <div style={{ padding: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', color: '#f87171', display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertCircle size={20} />
        <span style={{ flex: 1 }}><strong>Failed to load</strong> — {error}</span>
        <button className="btn btn-sm btn-secondary" onClick={fetchData}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="page-content">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Incentives</h1>
          <p>Assign and send customer incentives. Incentives are <strong>never sent automatically</strong> — you choose when and how.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Incentive
        </button>
      </div>

      {/* ── Hard Rule Banner ── */}
      <div style={{ padding: '10px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8125rem', color: '#f59e0b' }}>
        <Hand size={15} />
        <span><strong>Client-Controlled:</strong> Incentives only activate when enabled on a campaign. The system never sends an incentive without your explicit approval.</span>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total',    value: stats.total,    color: 'var(--brand-primary)' },
          { label: 'Pending',  value: stats.pending,  color: 'var(--brand-warning)' },
          { label: 'Sent',     value: stats.sent,     color: 'var(--brand-info)' },
          { label: 'Redeemed', value: stats.redeemed, color: 'var(--brand-success)' },
          { label: 'Expired',  value: stats.expired,  color: 'var(--text-muted)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value ?? 0}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--space-lg)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingLeft: 32, height: 36, fontSize: '0.875rem' }}
            placeholder="Search by customer, value…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 140, height: 36, fontSize: '0.875rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
        </select>
        <select className="input" style={{ width: 200, height: 36, fontSize: '0.875rem' }} value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>{formatReadable(c.name)}</option>)}
        </select>
        {(search || filterStatus || filterCampaign) && (
          <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => { setSearch(''); setFilterStatus(''); setFilterCampaign(''); }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Incentive Cards ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={incentives.length === 0 ? 'No incentives yet' : 'No incentives match your filters'}
          description={incentives.length === 0
            ? 'Create your first incentive to start rewarding customers for their reviews.'
            : 'Try adjusting your search or filters.'}
          action={incentives.length === 0 ? (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Plus size={16} /> New Incentive
            </button>
          ) : null}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((inc, idx) => {
              const typeM   = TYPE_META[inc.incentiveType]   || TYPE_META.freebie;
              const methodM = METHOD_META[inc.send_method]   || METHOD_META.manual;
              const TypeIcon = typeM.icon;

              return (
                <motion.div
                  key={inc.incentiveId}
                  layout
                  className="card"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
                >
                  {/* Type icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-lg)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.12))',
                  }}>
                    <TypeIcon size={22} style={{ color: 'var(--text-brand)' }} />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {getIncentiveLabel(inc)}
                      </span>
                      <span className={`badge ${typeM.color}`}>{typeM.label}</span>
                      <span className={`badge ${STATUS_COLOR[inc.status] || 'badge-neutral'}`}>{inc.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {inc.customerName ? <><strong style={{ color: 'var(--text-secondary)' }}>{inc.customerName}</strong> · </> : ''}
                      {inc.customerPhone || inc.customerEmail ? (
                        <span style={{ color: 'var(--text-brand)', fontWeight: 500 }}>
                          {inc.customerPhone || inc.customerEmail} · 
                        </span>
                      ) : null}
                      {formatReadable(inc.campaignName) || 'No campaign'} · Created {formatDateTime(inc.createdAt)}
                    </div>
                    {inc.notes && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{inc.notes}</div>
                    )}
                    {inc.sentAt && (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Sent {formatDateTime(inc.sentAt)} via {inc.sendMethod}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {inc.status === 'pending' && (
                      <button className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => setShowSend(inc)}>
                        <Send size={13} /> Send
                      </button>
                    )}
                    {inc.status === 'sent' && (
                      <button className="btn btn-success btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                        onClick={() => handleRedeem(inc)}>
                        <CheckCircle2 size={13} /> Redeemed
                      </button>
                    )}
                    {(inc.status === 'pending' || inc.status === 'sent') && (
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}
                        onClick={() => handleExpire(inc)} title="Expire incentive">
                        <XCircle size={14} />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════════════════
           CREATE INCENTIVE MODAL
         ══════════════════════════════ */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setFormData(EMPTY_FORM); }} title="Create Incentive" maxWidth={500}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Campaign *</label>
            <select required className="input" value={formData.campaignId}
              onChange={e => setFormData({ ...formData, campaignId: e.target.value })}>
              <option value="">Select a campaign…</option>
              {campaigns.map(c => (
                <option key={c.campaignId} value={c.campaignId}>
                  {formatReadable(c.name)}{!c.enableIncentives ? ' (incentives disabled)' : ''}
                </option>
              ))}
            </select>

            {/* Inline warning when selected campaign has incentives disabled */}
            {(() => {
              const selectedCampaign = campaigns.find(c => c.campaignId === formData.campaignId);
              if (!selectedCampaign || selectedCampaign.enableIncentives) return null;
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 'var(--radius-md)', marginTop: 6,
                }}>
                  <AlertCircle size={15} style={{ color: '#f87171', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: '0.8125rem', color: '#f87171' }}>
                    Incentives are disabled for <strong>{formatReadable(selectedCampaign.name)}</strong>.
                    Enable them to proceed.
                  </span>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    disabled={enablingIncentives}
                    onClick={() => handleEnableIncentives(selectedCampaign.campaignId)}
                    style={{ flexShrink: 0, fontSize: '0.75rem' }}
                  >
                    {enablingIncentives ? 'Enabling…' : 'Enable Now'}
                  </button>
                </div>
              );
            })()}

            {!formData.campaignId && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Incentives are blocked unless the campaign has incentives enabled.
              </p>
            )}
          </div>

          <div className="input-group">
            <label>Customer Name</label>
            <input className="input" placeholder="e.g. Jane Smith"
              value={formData.customerName}
              onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Customer Phone</label>
              <input className="input" placeholder="e.g. +1234567890"
                value={formData.customerPhone}
                onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Customer Email</label>
              <input className="input" placeholder="e.g. jane@example.com"
                value={formData.customerEmail}
                onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Type *</label>
              <select required className="input" value={formData.incentiveType}
                onChange={e => setFormData({ ...formData, incentiveType: e.target.value })}>
                {Object.entries(TYPE_META).map(([v, m]) => (
                  <option key={v} value={v}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label>
                Value * &nbsp;
                <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.75rem' }}>
                  {formData.incentiveType === 'percent' ? 'e.g. 10 (for 10%)' :
                   formData.incentiveType === 'fixed'   ? 'e.g. 5.00 ($5 off)' :
                   'e.g. Free coffee'}
                </span>
              </label>
              <input required className="input"
                placeholder={TYPE_META[formData.incentiveType]?.eg || ''}
                value={formData.incentiveValue}
                onChange={e => setFormData({ ...formData, incentiveValue: e.target.value })} />
            </div>
          </div>

          <div className="input-group">
            <label>Send Method</label>
            <select className="input" value={formData.sendMethod}
              onChange={e => setFormData({ ...formData, sendMethod: e.target.value })}>
              {Object.entries(METHOD_META).map(([v, m]) => (
                <option key={v} value={v}>{m.label}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Notes <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" placeholder="Internal note or terms…"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setFormData(EMPTY_FORM); }}>Cancel</button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isSubmitting ||
                enablingIncentives ||
                !!campaigns.find(c => c.campaignId === formData.campaignId && !c.enableIncentives)
              }
              title={
                campaigns.find(c => c.campaignId === formData.campaignId && !c.enableIncentives)
                  ? 'Enable incentives for this campaign first'
                  : undefined
              }
            >
              {isSubmitting ? 'Creating…' : 'Create Incentive'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════
           SEND INCENTIVE MODAL
         ══════════════════════════════ */}
      <Modal isOpen={!!showSend} onClose={() => setShowSend(null)} title="Send Incentive" maxWidth={420}>
        {showSend && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Summary */}
            <div style={{ padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 700, fontSize: '1.125rem', color: 'var(--text-brand)', marginBottom: 4 }}>
                {getIncentiveLabel(showSend)}
              </div>
              {showSend.customerName && (
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>For: {showSend.customerName}</div>
              )}
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>
              Choose how to send this incentive to the customer. This action marks the incentive as "sent".
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(METHOD_META).map(([method, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={method}
                    className="btn btn-secondary"
                    disabled={isSubmitting}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-start', padding: '12px 16px' }}
                    onClick={() => handleSend(showSend, method)}
                  >
                    <Icon size={16} style={{ color: meta.color }} />
                    <span>Send via <strong>{meta.label}</strong></span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setShowSend(null)}>Cancel</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
