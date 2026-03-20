import QRCode from 'react-qr-code';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download, Power, PowerOff, ExternalLink, Plus, LinkIcon, Settings2, AlertTriangle, Phone, User, Mail, Instagram, ShieldCheck, FlaskConical, CheckCircle2 } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import CopyButton from '../components/shared/CopyButton';
import Modal from '../components/shared/Modal';
import { qrCodesApi, campaignsApi } from '../lib/api';
import { formatDateTime, formatReadable } from '../lib/utils';

const FIELD_DEFS = [
  { key: 'captureName',    label: 'Name',                      icon: User,        dbKey: 'capture_name' },
  { key: 'capturePhone',   label: 'Phone',                     icon: Phone,       dbKey: 'capture_phone', warn: true },
  { key: 'captureEmail',   label: 'Email',                     icon: Mail,        dbKey: 'capture_email' },
  { key: 'captureSocial',  label: 'Instagram / TikTok / Facebook', icon: Instagram, dbKey: 'capture_social' },
  { key: 'requireConsent', label: 'Consent Checkbox',          icon: ShieldCheck, dbKey: 'require_consent' },
];

export default function QrCodesPage() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [qrCodes, setQrCodes] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Landing Page Builder
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderQr, setBuilderQr] = useState(null);
  const [builderFields, setBuilderFields] = useState({});
  const [isSavingBuilder, setIsSavingBuilder] = useState(false);
  const [builderSaved, setBuilderSaved] = useState(false);
  const qrRefs = useRef({});

  useEffect(() => {
    Promise.all([qrCodesApi.list(), campaignsApi.list()])
      .then(([qrRes, campRes]) => {
        setQrCodes(qrRes.data);
        setCampaigns(campRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content">Loading...</div>;

  const getCampaignName = (campaignId) => {
    const c = campaigns.find(c => c.campaignId === campaignId);
    return formatReadable(c?.name) || campaignId;
  };

  const handleGenerate = async () => {
    if (!selectedCampaign) return;
    setIsGenerating(true);
    try {
      await qrCodesApi.create(selectedCampaign);
      const qrRes = await qrCodesApi.list();
      setQrCodes(qrRes.data);
      setShowGenerate(false);
      setSelectedCampaign('');
    } catch (err) {
      console.error(err);
      alert('Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleQrCode = async (id) => {
    try {
      await qrCodesApi.toggle(id);
      const qrRes = await qrCodesApi.list();
      setQrCodes(qrRes.data);
    } catch (err) {
      console.error(err);
      alert('Failed to toggle QR code');
    }
  };

  const openBuilder = async (qr) => {
    setBuilderSaved(false);
    try {
      const res = await campaignsApi.get(qr.campaignId);
      const c = res.data;
      setBuilderFields({
        captureName:    !!c.captureName,
        capturePhone:   !!c.capturePhone,
        captureEmail:   !!c.captureEmail,
        captureSocial:  !!c.captureSocial,
        requireConsent: !!c.requireConsent,
      });
      setBuilderQr(qr);
      setShowBuilder(true);
    } catch (err) {
      console.error(err);
      alert('Failed to load campaign settings');
    }
  };

  const saveBuilder = async () => {
    if (!builderQr) return;
    setIsSavingBuilder(true);
    try {
      await campaignsApi.update(builderQr.campaignId, {
        captureName:    builderFields.captureName,
        capturePhone:   builderFields.capturePhone,
        captureEmail:   builderFields.captureEmail,
        captureSocial:  builderFields.captureSocial,
        requireConsent: builderFields.requireConsent,
      });
      setBuilderSaved(true);
      setTimeout(() => {
        setShowBuilder(false);
        setBuilderSaved(false);
      }, 1400);
    } catch (err) {
      console.error(err);
      alert('Failed to save settings');
    } finally {
      setIsSavingBuilder(false);
    }
  };

  const testLandingPage = (shortCode) => {
    window.open(`/r/${shortCode}`, '_blank');
  };

  const downloadQr = (qrCodeId, shortCode) => {
    const svg = qrRefs.current[qrCodeId]?.querySelector('svg');
    if (!svg) return;
    const serialized = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([serialized], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${shortCode}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>QR Codes</h1>
          <p>Generate and manage QR codes for your review campaigns.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowGenerate(true)}>
          <Plus size={16} />
          Generate QR Code
        </button>
      </div>

      {/* QR Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
        {qrCodes.map((qr, idx) => {
          const scanUrl = `${window.location.origin}/r/${qr.shortCode}`;
          return (
          <motion.div
            key={qr.qrCodeId}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{ padding: 0, overflow: 'hidden' }}
          >
            <div style={{ padding: 20 }}>
              {/* QR Visual */}
              <div
                ref={el => { if (el) qrRefs.current[qr.qrCodeId] = el; }}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  maxWidth: 200,
                  margin: '0 auto 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  padding: '16px',
                }}
              >
                <QRCode value={scanUrl} size={168} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
              </div>

              {/* Info */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.1em',
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}>
                  {qr.shortCode}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  {getCampaignName(qr.campaignId)}
                </div>
              </div>

              {/* URL */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
              }}>
                <LinkIcon size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{
                  fontSize: '0.8125rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-brand)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}>
                  {scanUrl}
                </span>
                <CopyButton text={scanUrl} label="Copy" size="sm" />
              </div>

              {/* Status + Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <StatusBadge status={qr.active ? 'active' : 'disabled'} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Download QR" onClick={() => downloadQr(qr.qrCodeId, qr.shortCode)}>
                    <Download size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Configure Landing Form" onClick={() => openBuilder(qr)}>
                    <Settings2 size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Scan & Test Landing Page" onClick={() => testLandingPage(qr.shortCode)}>
                    <FlaskConical size={15} />
                  </button>
                  <a href={scanUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-icon btn-sm" title="Open live link">
                    <ExternalLink size={15} />
                  </a>
                  <button
                    className={`btn btn-sm ${qr.active ? 'btn-danger' : 'btn-success'}`}
                    style={{ padding: '4px 10px' }}
                    onClick={() => toggleQrCode(qr.qrCodeId)}
                  >
                    {qr.active ? <PowerOff size={13} /> : <Power size={13} />}
                    {qr.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>

            <div style={{
              padding: '10px 20px',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              Created {formatDateTime(qr.createdAt)}
            </div>
          </motion.div>
          );
        })}
      </div>

      {/* Landing Page Builder Modal */}
      <Modal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        title="Landing Page Form Builder"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {/* Header info */}
          <div style={{ padding: '10px 14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            QR: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{builderQr?.shortCode}</span>
            &nbsp;—&nbsp;{builderQr && getCampaignName(builderQr.campaignId)}
          </div>

          {/* Save success banner */}
          {builderSaved && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.35)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: '#10b981',
              }}
            >
              <CheckCircle2 size={15} />
              <span><strong>Saved!</strong> Landing page form updated successfully.</span>
            </motion.div>
          )}

          {/* Phone-off warning */}
          {!builderFields.capturePhone && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '10px 14px',
                background: 'rgba(234,179,8,0.1)',
                border: '1px solid rgba(234,179,8,0.35)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8125rem',
                color: '#ca8a04',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                <strong>Phone capture is OFF</strong> — AI Voice Thank-You call will not work for customers who scan this QR code.
              </span>
            </motion.div>
          )}

          {/* Toggle rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FIELD_DEFS.map(({ key, label, icon: Icon, warn }) => (
              <div
                key={key}
                onClick={() => setBuilderFields(prev => ({ ...prev, [key]: !prev[key] }))}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: builderFields[key] ? 'var(--bg-brand-subtle, rgba(99,102,241,0.08))' : 'var(--bg-surface)',
                  border: `1px solid ${builderFields[key] ? 'rgba(99,102,241,0.35)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={16} style={{ color: builderFields[key] ? 'var(--text-brand)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</span>
                  {warn && builderFields[key] && (
                    <span style={{ fontSize: '0.6875rem', background: 'rgba(16,185,129,0.15)', color: '#10b981', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>
                      AI Voice ✓
                    </span>
                  )}
                  {warn && !builderFields[key] && (
                    <span style={{ fontSize: '0.6875rem', background: 'rgba(234,179,8,0.12)', color: '#ca8a04', padding: '2px 6px', borderRadius: 99, fontWeight: 600 }}>
                      AI Voice ✗
                    </span>
                  )}
                </div>
                {/* Toggle pill */}
                <div style={{
                  width: 40, height: 22, borderRadius: 99,
                  background: builderFields[key] ? 'var(--color-brand, #6366f1)' : 'var(--border-default, #334155)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}>
                  <div style={{
                    position: 'absolute', top: 3,
                    left: builderFields[key] ? 20 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: 'white', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              style={{ gap: 6 }}
              onClick={() => builderQr && testLandingPage(builderQr.shortCode)}
              disabled={!builderQr}
            >
              <FlaskConical size={14} />
              Test Landing Page
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => { setShowBuilder(false); setBuilderSaved(false); }} disabled={isSavingBuilder}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBuilder} disabled={isSavingBuilder || builderSaved}>
                {builderSaved ? <CheckCircle2 size={14} /> : <Settings2 size={14} />}
                {isSavingBuilder ? 'Saving...' : builderSaved ? 'Saved!' : 'Save Form Settings'}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Generate Modal */}
      <Modal isOpen={showGenerate} onClose={() => setShowGenerate(false)} title="Generate QR Code">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Select Campaign</label>
            <select 
              className="input" 
              style={{ cursor: 'pointer' }}
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
            >
              <option value="">Choose a campaign...</option>
              {campaigns.map(c => (
                <option key={c.campaignId} value={c.campaignId}>{formatReadable(c.name)}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowGenerate(false)} disabled={isGenerating}>Cancel</button>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedCampaign || isGenerating}>
              <QrCode size={14} />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
