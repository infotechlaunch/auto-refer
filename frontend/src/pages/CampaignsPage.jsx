import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Search, Megaphone, MapPin, Clock, Volume2, Instagram,
  Gift, Share2, MoreHorizontal, ExternalLink, Edit, Trash2, Eye, QrCode,
  User, Phone, Mail, CheckCircle2
} from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { campaignsApi, qrCodesApi } from '../lib/api';
import { formatDateTime, formatReadable } from '../lib/utils';

function ToggleChip({ label, active }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      fontSize: '0.6875rem',
      fontWeight: 600,
      borderRadius: 'var(--radius-full)',
      background: active ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.08)',
      color: active ? 'var(--text-brand)' : 'var(--text-muted)',
      border: `1px solid ${active ? 'rgba(99, 102, 241, 0.2)' : 'var(--border-subtle)'}`,
    }}>
      <span style={{
        width: 5,
        height: 5,
        borderRadius: '50%',
        background: active ? 'var(--brand-primary-light)' : 'var(--text-muted)',
        opacity: active ? 1 : 0.4,
      }} />
      {label}
    </span>
  );
}

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = {
    name: '',
    googleReviewUrl: '',
    thankWindowHours: 24,
    enableVoiceLinkage: true,
    enableInfluencerCapture: false,
    enableIncentives: false,
    enableReferrals: false,
    rushHours: {
      lunch: ['11:30', '14:30'],
      dinner: ['18:00', '22:00']
    },
    captureName: true,
    capturePhone: true,
    captureEmail: false,
    captureSocial: false,
    requireConsent: true
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    Promise.all([campaignsApi.list(), qrCodesApi.list()])
      .then(([campRes, qrRes]) => {
        setCampaigns(campRes.data);
        setQrCodes(qrRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const getQrCount = (campaignId) => qrCodes.filter(q => q.campaignId === campaignId && q.active).length;

  const handleCreateCampaign = async () => {
    if (!formData.name) return alert('Business Name is required');
    
    setIsSubmitting(true);
    try {
      await campaignsApi.create(formData);
      const [campRes, qrRes] = await Promise.all([
        campaignsApi.list(),
        qrCodesApi.list()
      ]);
      setCampaigns(campRes.data);
      setQrCodes(qrRes.data);
      setShowCreate(false);
      setFormData(initialForm);
    } catch (err) {
      alert('Error creating campaign: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCampaign = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      await campaignsApi.update(selectedCampaign.campaignId, formData);
      const campRes = await campaignsApi.list();
      setCampaigns(campRes.data);
      setShowEdit(false);
      setSelectedCampaign(null);
      setFormData(initialForm);
    } catch (err) {
      alert('Error updating campaign: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign? This will also remove associated QR codes.')) return;
    
    setIsSubmitting(true);
    try {
      await campaignsApi.delete(id);
      const campRes = await campaignsApi.list();
      setCampaigns(campRes.data);
      setSelectedCampaign(null);
    } catch (err) {
      alert('Error deleting campaign: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (campaign) => {
    setFormData({
      name: campaign.name,
      googleReviewUrl: campaign.googleReviewUrl || '',
      thankWindowHours: campaign.thankWindowHours,
      enableVoiceLinkage: campaign.enableVoiceLinkage,
      enableInfluencerCapture: campaign.enableInfluencerCapture,
      enableIncentives: campaign.enableIncentives,
      enableReferrals: campaign.enableReferrals,
      rushHours: campaign.rushHours,
      captureName: campaign.captureName,
      capturePhone: campaign.capturePhone,
      captureEmail: campaign.captureEmail,
      captureSocial: campaign.captureSocial,
      requireConsent: campaign.requireConsent
    });
    setSelectedCampaign(campaign);
    setShowEdit(true);
  };

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const updateRushHour = (period, type, val) => {
    setFormData(prev => ({
      ...prev,
      rushHours: {
        ...prev.rushHours,
        [period]: type === 'start' ? [val, prev.rushHours[period][1]] : [prev.rushHours[period][0], val]
      }
    }));
  };

  const LandingPageBuilder = () => (
    <div style={{
      padding: 'var(--space-md)',
      background: 'var(--bg-surface)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-subtle)',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <QrCode size={18} style={{ color: 'var(--brand-primary-light)' }} />
        <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          QR Landing Page Builder
        </div>
      </div>
      
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        Decide what information to collect from the customer when they scan your QR code.
      </p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          { label: 'Name', key: 'captureName', icon: User },
          { label: 'Phone', key: 'capturePhone', icon: Phone, badge: 'Required for Voice AI' },
          { label: 'Email', key: 'captureEmail', icon: Mail },
          { label: 'Instagram / TikTok / Facebook', key: 'captureSocial', icon: Instagram },
          { label: 'Consent Checkbox', key: 'requireConsent', icon: CheckCircle2 },
        ].map(f => (
          <div 
            key={f.key} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid transparent',
              transition: 'all 0.2s',
            }}
            onClick={() => updateFormData(f.key, !formData[f.key])}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ 
                width: 32, height: 32, borderRadius: 'var(--radius-sm)', 
                background: formData[f.key] ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: formData[f.key] ? 'var(--brand-primary-light)' : 'var(--text-muted)'
              }}>
                <f.icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: formData[f.key] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {f.label}
                </div>
                {f.badge && formData[f.key] && (
                  <div style={{ fontSize: '0.6875rem', color: 'var(--brand-success)', opacity: 0.8 }}>
                    ✅ {f.badge}
                  </div>
                )}
              </div>
            </div>
            <div className="toggle-track" data-active={formData[f.key].toString()}>
              <div className="toggle-thumb" />
            </div>
          </div>
        ))}
      </div>

      {!formData.capturePhone && formData.enableVoiceLinkage && (
        <div 
          style={{ 
            marginTop: 16, 
            padding: '12px', 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.8125rem', 
            color: 'var(--brand-danger)',
            display: 'flex',
            gap: 10
          }}
        >
          <div>
            ⚠️ <strong>Important rule:</strong> Phone capture OFF = AI Voice thank-you kaam nahi karega.
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Campaigns & Builder</h1>
          <p>Design your QR landing pages and manage feedback capture settings.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create Campaign
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, width: '100%' }}
          />
        </div>
      </div>

      {/* Campaign Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 'var(--space-lg)' }}>
        {filtered.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <Megaphone size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
            <p>No campaigns found. Create your first campaign to get started!</p>
          </div>
        ) : (
          filtered.map((campaign, idx) => (
            <motion.div
              key={campaign.campaignId}
              className="card card-interactive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
              onClick={() => setSelectedCampaign(campaign)}
            >
              <div style={{ height: 4, background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))' }} />
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{formatReadable(campaign.name)}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <MapPin size={12} />
                      {formatReadable(campaign.locationId)}
                    </div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary-light)' }}>
                    <Megaphone size={18} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{getQrCount(campaign.campaignId)}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>QR Codes</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{campaign.thankWindowHours}h</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Thank Window</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{Object.keys(campaign.rushHours).length}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Rush Slots</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ToggleChip label="Voice" active={campaign.enableVoiceLinkage} />
                  <ToggleChip label="Influencer" active={campaign.enableInfluencerCapture} />
                  <ToggleChip label="Incentives" active={campaign.enableIncentives} />
                  <ToggleChip label="Referrals" active={campaign.enableReferrals} />
                </div>
              </div>
              <div style={{ padding: '10px 20px', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Updated {formatDateTime(campaign.updatedAt)}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-ghost btn-icon btn-sm" title="View QR Codes"><QrCode size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Edit Campaign" onClick={(e) => { e.stopPropagation(); openEdit(campaign); }}><Edit size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Open Google Review Link" onClick={(e) => { e.stopPropagation(); window.open(campaign.googleReviewUrl); }}><ExternalLink size={14} /></button>
                  <button 
                    className="btn btn-ghost btn-icon btn-sm text-danger" 
                    title="Delete Campaign" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(campaign.campaignId); }}
                    style={{ color: 'var(--brand-danger)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Campaign Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Campaign" maxWidth={640}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Business Name</label>
            <input 
              className="input" 
              placeholder="e.g., Mario's Italian Kitchen" 
              value={formData.name}
              onChange={e => updateFormData('name', e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Business URL</label>
            <input 
              className="input" 
              placeholder="https://g.page/r/your-business/review" 
              value={formData.googleReviewUrl}
              onChange={e => updateFormData('googleReviewUrl', e.target.value)}
            />
          </div>



          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> Thank You Window
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  className="input" 
                  type="number" 
                  value={formData.thankWindowHours}
                  onChange={e => updateFormData('thankWindowHours', parseInt(e.target.value))}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>hours</span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <Clock size={14} /> Rush Hours
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {Object.entries(formData.rushHours).map(([period, times]) => (
                  <div key={period} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', width: 80, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{period}</span>
                    <input className="input input-sm" type="time" value={times[0]} onChange={e => updateRushHour(period, 'start', e.target.value)} />
                    <span style={{ opacity: 0.3 }}>–</span>
                    <input className="input input-sm" type="time" value={times[1]} onChange={e => updateRushHour(period, 'end', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <LandingPageBuilder />

          {/* Feature Toggles */}
          <div style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Feature Toggles (ON / OFF)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Voice Thank-You', key: 'enableVoiceLinkage', icon: Volume2 },
                { label: 'Influencer Capture', key: 'enableInfluencerCapture', icon: Instagram },
                { label: 'Incentives', key: 'enableIncentives', icon: Gift },
                { label: 'Referral Program', key: 'enableReferrals', icon: Share2 },
              ].map(f => (
                <div 
                  key={f.key} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => updateFormData(f.key, !formData[f.key])}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <f.icon size={15} style={{ color: formData[f.key] ? 'var(--brand-primary-light)' : 'inherit' }} />
                    {f.label}
                  </div>
                  <div className="toggle-track" data-active={formData[f.key].toString()}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button 
              className="btn btn-primary" 
              onClick={handleCreateCampaign}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Campaign" maxWidth={640}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Business Name</label>
            <input 
              className="input" 
              value={formData.name}
              onChange={e => updateFormData('name', e.target.value)}
            />
          </div>

          <div className="input-group">
            <label>Google Review URL</label>
            <input 
              className="input" 
              value={formData.googleReviewUrl}
              onChange={e => updateFormData('googleReviewUrl', e.target.value)}
            />
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={14} /> Thank You Window
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  className="input" 
                  type="number" 
                  value={formData.thankWindowHours}
                  onChange={e => updateFormData('thankWindowHours', parseInt(e.target.value))}
                  style={{ width: 80 }}
                />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>hours</span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>
                <Clock size={14} /> Rush Hours
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                {Object.entries(formData.rushHours).map(([period, times]) => (
                  <div key={period} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.75rem', width: 80, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{period}</span>
                    <input className="input input-sm" type="time" value={times[0]} onChange={e => updateRushHour(period, 'start', e.target.value)} />
                    <span style={{ opacity: 0.3 }}>–</span>
                    <input className="input input-sm" type="time" value={times[1]} onChange={e => updateRushHour(period, 'end', e.target.value)} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <LandingPageBuilder />

          <div style={{
            padding: 'var(--space-md)',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
              Feature Toggles (ON / OFF)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Voice Thank-You', key: 'enableVoiceLinkage', icon: Volume2 },
                { label: 'Influencer Capture', key: 'enableInfluencerCapture', icon: Instagram },
                { label: 'Incentives', key: 'enableIncentives', icon: Gift },
                { label: 'Referral Program', key: 'enableReferrals', icon: Share2 },
              ].map(f => (
                <div 
                  key={f.key} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => updateFormData(f.key, !formData[f.key])}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    <f.icon size={15} style={{ color: formData[f.key] ? 'var(--brand-primary-light)' : 'inherit' }} />
                    {f.label}
                  </div>
                  <div className="toggle-track" data-active={formData[f.key].toString()}>
                    <div className="toggle-thumb" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button className="btn btn-secondary" onClick={() => setShowEdit(false)}>Cancel</button>
            <button 
              className="btn btn-primary" 
              onClick={handleUpdateCampaign}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Update Campaign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Campaign Detail Modal */}
      <Modal
        isOpen={!!selectedCampaign && !showEdit}
        onClose={() => setSelectedCampaign(null)}
        title={formatReadable(selectedCampaign?.name) || ''}
        maxWidth={700}
      >
        {selectedCampaign && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Campaign ID</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedCampaign.campaignId.substring(0, 12)}...
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Business</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  {formatReadable(selectedCampaign.businessId)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Google Review URL</div>
                <a href={selectedCampaign.googleReviewUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--text-brand)', textDecoration: 'underline' }}>
                  {selectedCampaign.googleReviewUrl}
                </a>
              </div>

            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Rush Hours</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selectedCampaign.rushHours && typeof selectedCampaign.rushHours === 'object' && 
                  Object.entries(selectedCampaign.rushHours).map(([slot, times]) => {
                    const [start, end] = Array.isArray(times) ? times : [times?.start || '', times?.end || ''];
                    return (
                      <span key={slot} className="badge badge-info">
                        {slot}: {start}–{end}
                      </span>
                    );
                  })
                }
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Active Features</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ToggleChip label="Voice" active={selectedCampaign.enableVoiceLinkage} />
                  <ToggleChip label="Influencer" active={selectedCampaign.enableInfluencerCapture} />
                  <ToggleChip label="Incentives" active={selectedCampaign.enableIncentives} />
                  <ToggleChip label="Referrals" active={selectedCampaign.enableReferrals} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Landing Page Capture</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ToggleChip label="Name" active={selectedCampaign.captureName} />
                  <ToggleChip label="Phone" active={selectedCampaign.capturePhone} />
                  <ToggleChip label="Email" active={selectedCampaign.captureEmail} />
                  <ToggleChip label="Social" active={selectedCampaign.captureSocial} />
                  <ToggleChip label="Consent" active={selectedCampaign.requireConsent} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
              <button className="btn btn-secondary" onClick={() => openEdit(selectedCampaign)}>
                <Edit size={14} />
                Edit
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleDeleteCampaign(selectedCampaign.campaignId)}
                disabled={isSubmitting}
              >
                <Trash2 size={14} />
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
