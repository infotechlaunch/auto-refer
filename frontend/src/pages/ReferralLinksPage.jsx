import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, ExternalLink, MessageCircle, Mail, QrCode,
  Trash2, Edit2, Search, Activity, X, AlertCircle,
  ToggleLeft, ToggleRight,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import CopyButton from '../components/shared/CopyButton';
import Modal from '../components/shared/Modal';
import EmptyState from '../components/shared/EmptyState';
import { referralLinksApi, referralProgramsApi } from '../lib/api';
import { formatDateTime, formatReadable } from '../lib/utils';

const REFERRER_TYPES = [
  { value: 'customer',    label: 'Customer',    color: 'badge-info' },
  { value: 'business',    label: 'Business',    color: 'badge-success' },
  { value: 'agency',      label: 'Agency',      color: 'badge-warning' },
  { value: 'influencer',  label: 'Influencer',  color: 'badge-danger' },
  { value: 'itl_partner', label: 'ITL Partner', color: 'badge-neutral' },
];

const EMPTY_FORM = { referralProgramId: '', referrerType: 'customer', code: '', maxUses: '0', expiresAt: '' };

export default function ReferralLinksPage() {
  const [referralLinks, setReferralLinks] = useState([]);
  const [referralPrograms, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editLink, setEditLink] = useState(null);
  const [qrLink, setQrLink] = useState(null);
  const [eventsLink, setEventsLink] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Forms
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({ status: 'active', maxUses: '0', expiresAt: '' });

  const fetchData = () => {
    setLoading(true);
    setFetchError(null);
    Promise.all([referralLinksApi.list(), referralProgramsApi.list()])
      .then(([linksRes, progsRes]) => {
        setReferralLinks(linksRes.data || []);
        setPrograms(progsRes.data || []);
      })
      .catch(err => setFetchError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filteredLinks = useMemo(() => referralLinks.filter(link => {
    if (search && !link.code.toLowerCase().includes(search.toLowerCase()) &&
        !(link.shareUrl || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProgram && link.referralProgramId !== filterProgram) return false;
    if (filterStatus && link.status !== filterStatus) return false;
    return true;
  }), [referralLinks, search, filterProgram, filterStatus]);

  const stats = useMemo(() => ({
    total: referralLinks.length,
    active: referralLinks.filter(l => l.status === 'active').length,
    totalUses: referralLinks.reduce((sum, l) => sum + (l.usageCount || 0), 0),
    expired: referralLinks.filter(l => l.status === 'expired').length,
  }), [referralLinks]);

  const getProgramName = id => formatReadable(referralPrograms.find(p => p.referralProgramId === id)?.name) || 'Unknown Program';
  const getReferrerBadgeColor = type => REFERRER_TYPES.find(t => t.value === type)?.color || 'badge-neutral';

  // ── Create ──
  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await referralLinksApi.create({
        ...formData,
        maxUses: parseInt(formData.maxUses) || 0,
        expiresAt: formData.expiresAt || null,
      });
      setShowCreate(false);
      setFormData(EMPTY_FORM);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit ──
  const openEdit = (link) => {
    setEditLink(link);
    setEditForm({
      status: link.status,
      maxUses: String(link.maxUses || 0),
      expiresAt: link.expiresAt ? link.expiresAt.split('T')[0] : '',
    });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await referralLinksApi.update(editLink.referralId, {
        status: editForm.status,
        maxUses: parseInt(editForm.maxUses) || 0,
        expiresAt: editForm.expiresAt || null,
      });
      setEditLink(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update link');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Toggle status ──
  const handleToggle = async (link) => {
    try {
      await referralLinksApi.update(link.referralId, {
        status: link.status === 'active' ? 'inactive' : 'active',
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    }
  };

  // ── Delete ──
  const handleDelete = async (link) => {
    try {
      await referralLinksApi.delete(link.referralId);
      setDeleteConfirm(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to delete link');
    }
  };

  // ── Share helpers ──
  const handleWhatsAppShare = (url, code) => {
    const text = `Join our referral program! Use my code ${code} or click here: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmailShare = (url, code) => {
    const subject = "You've been referred!";
    const body = `Hey!\n\nI'd like to invite you to our platform.\n\nUse my referral code: ${code}\nOr click here: ${url}\n\nSee you there!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  // ── Events ──
  const openEvents = async (link) => {
    setEventsLink(link);
    setEventsLoading(true);
    setEvents([]);
    try {
      const res = await referralLinksApi.events(link.referralId);
      setEvents(res.data || []);
    } catch {
      setEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  // ── Loading / Error states ──
  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Share2 size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
        <div>Loading referral links…</div>
      </div>
    </div>
  );

  if (fetchError) return (
    <div className="page-content">
      <div style={{ padding: 24, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-lg)', color: '#f87171', display: 'flex', gap: 12, alignItems: 'center' }}>
        <AlertCircle size={20} />
        <span style={{ flex: 1 }}><strong>Failed to load</strong> — {fetchError}</span>
        <button className="btn btn-sm btn-secondary" onClick={fetchData}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="page-content">

      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1>Referral Links</h1>
          <p>Generate and manage referral links across programs. Share via WhatsApp, email, or QR code.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Share2 size={16} /> Create Link
        </button>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total Links',  value: stats.total,     color: 'var(--brand-primary)' },
          { label: 'Active',       value: stats.active,    color: 'var(--brand-success)' },
          { label: 'Total Uses',   value: stats.totalUses, color: 'var(--brand-cyan)' },
          { label: 'Expired',      value: stats.expired,   color: 'var(--brand-warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--space-lg)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 32, height: 36, fontSize: '0.875rem' }}
            placeholder="Search by code or URL…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 200, height: 36, fontSize: '0.875rem' }} value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
          <option value="">All Programs</option>
          {referralPrograms.map(p => <option key={p.referralProgramId} value={p.referralProgramId}>{formatReadable(p.name)}</option>)}
        </select>
        <select className="input" style={{ width: 140, height: 36, fontSize: '0.875rem' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
        {(search || filterProgram || filterStatus) && (
          <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => { setSearch(''); setFilterProgram(''); setFilterStatus(''); }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Link Cards ── */}
      {filteredLinks.length === 0 ? (
        <EmptyState
          icon={Share2}
          title={referralLinks.length === 0 ? 'No referral links yet' : 'No links match your filters'}
          description={referralLinks.length === 0
            ? 'Create your first referral link to start tracking and sharing referrals.'
            : 'Try adjusting your search or filters.'}
          action={referralLinks.length === 0 ? (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              <Share2 size={16} /> Create First Link
            </button>
          ) : null}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <AnimatePresence mode="popLayout">
            {filteredLinks.map((link, idx) => (
              <motion.div
                key={link.referralId}
                layout
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: idx * 0.05 }}
                style={{ padding: 0, overflow: 'hidden' }}
              >
                {/* Delete confirmation banner */}
                {deleteConfirm?.referralId === link.referralId && (
                  <div style={{
                    padding: '10px 20px',
                    background: 'rgba(239,68,68,0.1)',
                    borderBottom: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.875rem',
                  }}>
                    <AlertCircle size={16} style={{ color: '#f87171', flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-primary)' }}>
                      Permanently delete link <strong>{link.code}</strong>? This cannot be undone.
                    </span>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(link)}>Delete</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(null)}>Cancel</button>
                  </div>
                )}

                <div style={{ padding: '20px', display: 'flex', gap: 20, alignItems: 'center' }}>
                  {/* Code badge */}
                  <div style={{
                    width: 80, height: 80, borderRadius: 'var(--radius-lg)',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-brand)', letterSpacing: '0.06em' }}>
                      {link.code}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {getProgramName(link.referralProgramId)}
                      </h3>
                      <span className={`badge ${getReferrerBadgeColor(link.referrerType)}`}>{link.referrerType}</span>
                      <StatusBadge status={link.status} />
                    </div>

                    {/* Share URL */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 12px', background: 'var(--bg-surface)',
                      borderRadius: 'var(--radius-md)', marginBottom: 12, maxWidth: 480,
                    }}>
                      <span style={{
                        fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', color: 'var(--text-brand)',
                        flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {link.shareUrl}
                      </span>
                      <CopyButton text={link.shareUrl} size="sm" />
                    </div>

                    {/* Actions row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{link.usageCount || 0}</span>
                        {link.maxUses > 0 ? ` / ${link.maxUses} uses` : ' uses (unlimited)'}
                      </div>

                      <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

                      {/* Share buttons */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Share via WhatsApp" style={{ color: '#25D366' }}
                          onClick={() => handleWhatsAppShare(link.shareUrl, link.code)}>
                          <MessageCircle size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Share via Email"
                          onClick={() => handleEmailShare(link.shareUrl, link.code)}>
                          <Mail size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Show QR Code"
                          onClick={() => setQrLink(link)}>
                          <QrCode size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Open referral page"
                          onClick={() => window.open(link.shareUrl, '_blank', 'noopener,noreferrer')}>
                          <ExternalLink size={15} />
                        </button>
                      </div>

                      <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

                      {/* Management buttons */}
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View referral events"
                          onClick={() => openEvents(link)}>
                          <Activity size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit link"
                          onClick={() => openEdit(link)}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          title={link.status === 'active' ? 'Deactivate' : 'Activate'}
                          style={{ color: link.status === 'active' ? 'var(--brand-warning)' : 'var(--brand-success)' }}
                          onClick={() => handleToggle(link)}>
                          {link.status === 'active' ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Delete link" style={{ color: 'var(--brand-danger)' }}
                          onClick={() => setDeleteConfirm(link)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Capacity ring */}
                  <div style={{ textAlign: 'center', minWidth: 72, flexShrink: 0 }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%',
                      border: `3px solid ${link.maxUses > 0 && (link.usageCount || 0) >= link.maxUses * 0.9 ? 'var(--brand-warning)' : 'var(--brand-primary)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px',
                    }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {link.maxUses > 0 ? `${Math.round((link.usageCount || 0) / link.maxUses * 100)}%` : '∞'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>capacity</div>
                  </div>
                </div>

                {/* Footer */}
                <div style={{
                  padding: '10px 20px', background: 'var(--bg-surface)',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '0.75rem', color: 'var(--text-muted)',
                }}>
                  <span>Created {formatDateTime(link.createdAt)}</span>
                  <span>{link.expiresAt ? `Expires ${formatDateTime(link.expiresAt)}` : 'No expiration'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════════════════
           CREATE MODAL
         ══════════════════════════════ */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setFormData(EMPTY_FORM); }} title="Create Referral Link" maxWidth={500}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Referral Program *</label>
            <select required className="input" value={formData.referralProgramId}
              onChange={e => setFormData({ ...formData, referralProgramId: e.target.value })}>
              <option value="">Select a program…</option>
              {referralPrograms.map(p => (
                <option key={p.referralProgramId} value={p.referralProgramId}>{formatReadable(p.name)}</option>
              ))}
            </select>
            {referralPrograms.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--brand-warning)', margin: '4px 0 0' }}>
                No programs found. Create a referral program first.
              </p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Referrer Type</label>
              <select className="input" value={formData.referrerType}
                onChange={e => setFormData({ ...formData, referrerType: e.target.value })}>
                {REFERRER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label>Custom Code <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input className="input" placeholder="Auto-generated if blank"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Max Uses <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(0 = unlimited)</span></label>
              <input type="number" min="0" className="input" value={formData.maxUses}
                onChange={e => setFormData({ ...formData, maxUses: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Expiration Date <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span></label>
              <input type="date" className="input" value={formData.expiresAt}
                onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowCreate(false); setFormData(EMPTY_FORM); }}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formData.referralProgramId}>
              {isSubmitting ? 'Creating…' : 'Create Link'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════
           EDIT MODAL
         ══════════════════════════════ */}
      <Modal isOpen={!!editLink} onClose={() => setEditLink(null)} title={`Edit Link · ${editLink?.code}`} maxWidth={420}>
        <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Status</label>
            <select className="input" value={editForm.status}
              onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Max Uses <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(0 = unlimited)</span></label>
              <input type="number" min="0" className="input" value={editForm.maxUses}
                onChange={e => setEditForm({ ...editForm, maxUses: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Expiration Date</label>
              <input type="date" className="input" value={editForm.expiresAt}
                onChange={e => setEditForm({ ...editForm, expiresAt: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditLink(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════
           QR CODE MODAL
         ══════════════════════════════ */}
      <Modal isOpen={!!qrLink} onClose={() => setQrLink(null)} title={`QR Code · ${qrLink?.code}`} maxWidth={360}>
        {qrLink && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '8px 0 16px' }}>
            <div style={{ padding: 16, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrLink.shareUrl)}`}
                alt={`QR code for ${qrLink.code}`}
                width={220}
                height={220}
                style={{ display: 'block' }}
              />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-brand)', marginBottom: 6 }}>
                {qrLink.code}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                {qrLink.shareUrl}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrLink.shareUrl)}&download=1`}
                download={`qr-${qrLink.code}.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                Download QR
              </a>
              <CopyButton text={qrLink.shareUrl} label="Copy URL" size="sm" />
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════
           EVENTS MODAL
         ══════════════════════════════ */}
      <Modal isOpen={!!eventsLink} onClose={() => setEventsLink(null)} title={`Referral Events · ${eventsLink?.code}`} maxWidth={600}>
        {eventsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Activity size={28} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div>Loading events…</div>
          </div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <Activity size={32} style={{ opacity: 0.25, marginBottom: 12 }} />
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No events yet</div>
            <div style={{ fontSize: '0.875rem' }}>Events will appear here when this link is used.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
              {events.length} event{events.length !== 1 ? 's' : ''} recorded
            </div>
            {events.map(event => (
              <div key={event.eventId} style={{
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', gap: 12,
                borderLeft: `3px solid ${
                  event.status === 'converted' ? 'var(--brand-success)'
                  : event.status === 'fraud'   ? 'var(--brand-danger)'
                  : 'var(--brand-primary)'
                }`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <StatusBadge status={event.status} />
                    {event.amount && (
                      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--brand-success)' }}>
                        +${parseFloat(event.amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(event.eventTs)}
                  </div>
                </div>
                {event.fraudScore != null && (
                  <div style={{ fontSize: '0.75rem', textAlign: 'right' }}>
                    <div style={{ color: event.fraudScore > 70 ? 'var(--brand-danger)' : 'var(--text-muted)' }}>
                      Fraud score: <strong>{event.fraudScore}</strong>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
}
