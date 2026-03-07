import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, PhoneCall, PhoneOff, Volume2, PlayCircle, Clock,
  Search, AlertCircle, CheckCircle2, X, ChevronDown,
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import EmptyState from '../components/shared/EmptyState';
import Modal from '../components/shared/Modal';
import { voiceThanksApi, campaignsApi } from '../lib/api';
import { formatDateTime } from '../lib/utils';

const SKIP_LABELS = {
  already_played: 'Already Played',
  no_review:      'No Recent Review',
  outside_window: 'Outside 24h Window',
  no_match:       'Phone Not Recognised',
  no_consent:     'No Consent',
};

const VARIANT_SCRIPT = {
  rush_hour: 'Thank you for your recent review! We really appreciate it.',
  standard:  'Hi! We noticed you recently left us a review — thank you so much, it means a lot to us.',
};

export default function VoiceThankYouPage() {
  const [events, setEvents]       = useState([]);
  const [stats, setStats]         = useState({ total: 0, totalPlayed: 0, totalSkipped: 0 });
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Filters
  const [search, setSearch]           = useState('');
  const [filterPlayed, setFilterPlayed] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');

  // Simulate call modal
  const [showSimulate, setShowSimulate]   = useState(false);
  const [simForm, setSimForm]             = useState({ phoneNumber: '', campaignId: '' });
  const [simResult, setSimResult]         = useState(null);
  const [simLoading, setSimLoading]       = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    const params = {};
    if (filterPlayed !== '')   params.played    = filterPlayed;
    if (filterCampaign !== '') params.campaign_id = filterCampaign;

    Promise.all([
      voiceThanksApi.list(params),
      campaignsApi.list(),
    ])
      .then(([vtRes, campRes]) => {
        setEvents(vtRes.data || []);
        setStats(vtRes.stats || { total: 0, totalPlayed: 0, totalSkipped: 0 });
        setCampaigns(campRes.data || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterPlayed, filterCampaign]);

  const filtered = useMemo(() => {
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(e =>
      (e.campaignName || '').toLowerCase().includes(q) ||
      (e.scriptVariant || '').toLowerCase().includes(q) ||
      (e.skipReason || '').toLowerCase().includes(q)
    );
  }, [events, search]);

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simForm.phoneNumber) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await voiceThanksApi.call(simForm.phoneNumber, simForm.campaignId || undefined);
      setSimResult(res);
      fetchData();
    } catch (err) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setSimLoading(false);
    }
  };

  const getCampaignName = id => campaigns.find(c => c.campaignId === id)?.name || id || '—';

  if (loading) return (
    <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
        <Volume2 size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
        <div>Loading voice events…</div>
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
          <h1>AI Voice Thank-You</h1>
          <p>Automatically thank customers who call after leaving a review. One thank-you per customer, never repeated.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSimResult(null); setShowSimulate(true); }}>
          <PhoneCall size={16} /> Simulate Call
        </button>
      </div>

      {/* ── How It Works ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 'var(--space-lg)', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', fontSize: '0.8125rem' }}>
          {[
            { icon: Phone,        step: '1', label: 'Customer calls', desc: 'Call comes in to the business' },
            { icon: Search,       step: '2', label: 'Identify caller', desc: 'Phone number matched to review intent' },
            { icon: CheckCircle2, step: '3', label: 'Check conditions', desc: 'Review exists + within 24 h + not played yet' },
            { icon: Volume2,      step: '4', label: 'Play thank-you', desc: 'Rush-hour or standard message plays once' },
          ].map(s => (
            <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: '1 1 160px' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <s.icon size={14} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{s.step}. {s.label}</div>
                <div style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
        {[
          { label: 'Total Calls',       value: stats.total,        color: 'var(--brand-primary)' },
          { label: 'Thank-Yous Played', value: stats.totalPlayed,  color: 'var(--brand-success)' },
          { label: 'Skipped',           value: stats.totalSkipped, color: 'var(--brand-warning)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Voice Scripts ── */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 'var(--space-lg)' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: 12 }}>Configured Voice Scripts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {Object.entries(VARIANT_SCRIPT).map(([variant, script]) => (
            <div key={variant} style={{ padding: '12px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${variant === 'rush_hour' ? 'var(--brand-warning)' : 'var(--brand-primary)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Volume2 size={14} style={{ color: variant === 'rush_hour' ? 'var(--brand-warning)' : 'var(--brand-primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                  {variant.replace('_', ' ')}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                "{script}"
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="card" style={{ padding: '12px 16px', marginBottom: 'var(--space-lg)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingLeft: 32, height: 36, fontSize: '0.875rem' }}
            placeholder="Search campaign, variant…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input" style={{ width: 160, height: 36, fontSize: '0.875rem' }} value={filterPlayed} onChange={e => setFilterPlayed(e.target.value)}>
          <option value="">All Calls</option>
          <option value="true">Played Only</option>
          <option value="false">Skipped Only</option>
        </select>
        <select className="input" style={{ width: 200, height: 36, fontSize: '0.875rem' }} value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
          <option value="">All Campaigns</option>
          {campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>{c.name}</option>)}
        </select>
        {(search || filterPlayed !== '' || filterCampaign) && (
          <button className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            onClick={() => { setSearch(''); setFilterPlayed(''); setFilterCampaign(''); }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* ── Events List ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={PhoneOff}
          title="No call events yet"
          description="Incoming calls will appear here once the voice system is active."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <AnimatePresence mode="popLayout">
            {filtered.map((ev, idx) => (
              <motion.div
                key={ev.eventId}
                layout
                className="card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: idx * 0.03 }}
                style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: ev.played ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
                }}>
                  {ev.played
                    ? <PlayCircle size={20} style={{ color: 'var(--brand-success)' }} />
                    : <PhoneOff  size={20} style={{ color: 'var(--brand-danger)' }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {ev.played ? 'Thank-you played' : 'Call skipped'}
                    </span>
                    {ev.played && ev.scriptVariant && (
                      <span className={`badge ${ev.scriptVariant === 'rush_hour' ? 'badge-warning' : 'badge-info'}`}>
                        {ev.scriptVariant.replace('_', ' ')}
                      </span>
                    )}
                    {!ev.played && ev.skipReason && (
                      <span className="badge badge-neutral">{SKIP_LABELS[ev.skipReason] || ev.skipReason}</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {getCampaignName(ev.campaignId)} • {formatDateTime(ev.callTs)}
                  </div>
                  {ev.played && ev.scriptVariant && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>
                      "{VARIANT_SCRIPT[ev.scriptVariant]}"
                    </div>
                  )}
                </div>

                {/* Status pill */}
                <div style={{ flexShrink: 0 }}>
                  {ev.played
                    ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--brand-success)' }}><CheckCircle2 size={13} /> Thanked</span>
                    : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}><X size={13} /> Skipped</span>
                  }
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ══════════════════════════════
           SIMULATE CALL MODAL
         ══════════════════════════════ */}
      <Modal isOpen={showSimulate} onClose={() => setShowSimulate(false)} title="Simulate Incoming Call" maxWidth={460}>
        <form onSubmit={handleSimulate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.07)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Simulate a customer call. The system will check if a thank-you voice message should play based on their recent review and the 24-hour window.
          </div>

          <div className="input-group">
            <label>Phone Number (Caller ID) *</label>
            <input className="input" type="tel" placeholder="+1 555 123 4567"
              value={simForm.phoneNumber}
              onChange={e => setSimForm({ ...simForm, phoneNumber: e.target.value })} required />
          </div>

          <div className="input-group">
            <label>Campaign <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional — auto-detected if blank)</span></label>
            <select className="input" value={simForm.campaignId}
              onChange={e => setSimForm({ ...simForm, campaignId: e.target.value })}>
              <option value="">Auto-detect from caller identity</option>
              {campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>{c.name}</option>)}
            </select>
          </div>

          {/* Result */}
          {simResult && (
            <div style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: simResult.playThankYou ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)',
              border: `1px solid ${simResult.playThankYou ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`,
            }}>
              {simResult.error ? (
                <div style={{ color: '#f87171', display: 'flex', gap: 8 }}>
                  <AlertCircle size={16} /> {simResult.error}
                </div>
              ) : simResult.playThankYou ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--brand-success)', marginBottom: 8 }}>
                    <PlayCircle size={16} /> Playing voice message
                    <span className={`badge ${simResult.variant === 'rush_hour' ? 'badge-warning' : 'badge-info'}`}>
                      {simResult.variant?.replace('_', ' ')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, fontStyle: 'italic' }}>
                    "{simResult.script}"
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontWeight: 500 }}>
                  <PhoneOff size={16} /> Not played — {SKIP_LABELS[simResult.reason] || simResult.reason}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowSimulate(false)}>Close</button>
            <button type="submit" className="btn btn-primary" disabled={simLoading}>
              {simLoading ? 'Processing…' : 'Simulate Call'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
