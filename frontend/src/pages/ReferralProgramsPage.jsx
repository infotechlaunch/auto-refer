import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Share2, Edit, Trash2, Calendar, DollarSign, Clock, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { referralProgramsApi } from '../lib/api';
import { formatCurrency, formatDateTime, formatReadable } from '../lib/utils';

export default function ReferralProgramsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editProgram, setEditProgram] = useState(null);
  const [referralPrograms, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    rewardType: 'cash',
    rewardValue: '',
    referredDiscountPercent: '10',
    holdDays: '14',
    minSubscriptionMonths: '1',
    expiresAt: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    rewardType: 'cash',
    rewardValue: '',
    referredDiscountPercent: '10',
    holdDays: '14',
    minSubscriptionMonths: '1',
    expiresAt: ''
  });

  const fetchData = () => {
    setLoading(true);
    referralProgramsApi.list()
      .then(res => setPrograms(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.rewardValue) return alert('Name and Reward Value are required');
    setIsSubmitting(true);
    try {
      await referralProgramsApi.create({
        ...formData,
        rewardValue: parseFloat(formData.rewardValue),
        referredDiscountPercent: parseInt(formData.referredDiscountPercent),
        holdDays: parseInt(formData.holdDays),
        minSubscriptionMonths: parseInt(formData.minSubscriptionMonths),
        expiresAt: formData.expiresAt || null
      });
      setShowCreate(false);
      setFormData({
        name: '', rewardType: 'cash', rewardValue: '', referredDiscountPercent: '10',
        holdDays: '14', minSubscriptionMonths: '1', expiresAt: ''
      });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to create program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateForm = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));
  const updateEditForm = (key, val) => setEditForm(prev => ({ ...prev, [key]: val }));

  const openEdit = (program) => {
    setEditForm({
      name: program.name,
      rewardType: program.rewardType,
      rewardValue: String(program.rewardValue),
      referredDiscountPercent: String(program.referredDiscountPercent),
      holdDays: String(program.holdDays),
      minSubscriptionMonths: String(program.minSubscriptionMonths),
      expiresAt: program.expiresAt ? program.expiresAt.split('T')[0] : '',
    });
    setEditProgram(program);
  };

  const handleEdit = async () => {
    if (!editForm.name || !editForm.rewardValue) return alert('Name and Reward Value are required');
    setIsSubmitting(true);
    try {
      await referralProgramsApi.update(editProgram.referralProgramId, {
        ...editForm,
        rewardValue: parseFloat(editForm.rewardValue),
        referredDiscountPercent: parseInt(editForm.referredDiscountPercent),
        holdDays: parseInt(editForm.holdDays),
        minSubscriptionMonths: parseInt(editForm.minSubscriptionMonths),
        expiresAt: editForm.expiresAt || null,
      });
      setEditProgram(null);
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update program');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (program) => {
    try {
      await referralProgramsApi.update(program.referralProgramId, { active: !program.active });
      fetchData();
    } catch (err) {
      alert(err.message || 'Failed to update program');
    }
  };

  if (loading) return <div className="page-content">Loading...</div>;


  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Referral Programs</h1>
          <p>Create and manage reward programs for your multi-channel referral engine.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Create Program
        </button>
      </div>

      {/* Programs Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 'var(--space-lg)' }}>
        {referralPrograms.map((program, idx) => (
          <motion.div
            key={program.referralProgramId}
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{ padding: 0, overflow: 'hidden' }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 20px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                  {formatReadable(program.name)}
                </h3>
                <StatusBadge status={program.active ? 'active' : 'disabled'} />
              </div>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-lg)',
                background: program.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: program.active ? 'var(--brand-success)' : 'var(--text-muted)',
              }}>
                <Share2 size={20} />
              </div>
            </div>

            {/* Reward Details */}
            <div style={{
              padding: '0 20px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
            }}>
              <div style={{
                padding: 12,
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Referrer Reward
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-success)' }}>
                  {program.rewardType === 'percent' ? `${program.rewardValue}%` : formatCurrency(program.rewardValue)}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {program.rewardType}
                </div>
              </div>
              <div style={{
                padding: 12,
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  Referred Discount
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-brand)' }}>
                  {program.referredDiscountPercent}%
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  off first invoice
                </div>
              </div>
            </div>

            {/* Rules */}
            <div style={{ padding: '0 20px 20px' }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                padding: 12,
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-md)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Clock size={13} /> Hold Period
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{program.holdDays} days</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Calendar size={13} /> Min Subscription
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{program.minSubscriptionMonths} month(s)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                    <Calendar size={13} /> Expires
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {program.expiresAt ? formatDateTime(program.expiresAt) : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              padding: '10px 20px',
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Created {formatDateTime(program.createdAt)}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(program)}>
                  <Edit size={14} />
                </button>
                <button className={`btn btn-sm ${program.active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(program)}>
                  {program.active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {program.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Program Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Referral Program" maxWidth={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Program Name</label>
            <input 
              className="input" 
              placeholder="e.g., Restaurant Growth Program" 
              value={formData.name}
              onChange={e => updateForm('name', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Reward Type</label>
              <select 
                className="input" 
                style={{ cursor: 'pointer' }}
                value={formData.rewardType}
                onChange={e => updateForm('rewardType', e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="percent">Percentage</option>
              </select>
            </div>
            <div className="input-group">
              <label>Reward Value</label>
              <input 
                className="input" 
                type="number" 
                placeholder="50.00" 
                value={formData.rewardValue}
                onChange={e => updateForm('rewardValue', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Referred Discount %</label>
              <input 
                className="input" 
                type="number" 
                placeholder="20" 
                value={formData.referredDiscountPercent}
                onChange={e => updateForm('referredDiscountPercent', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Hold Days</label>
              <input 
                className="input" 
                type="number" 
                value={formData.holdDays}
                onChange={e => updateForm('holdDays', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Min Subscription Months</label>
              <input 
                className="input" 
                type="number" 
                value={formData.minSubscriptionMonths}
                onChange={e => updateForm('minSubscriptionMonths', e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Expiry Date (optional)</label>
              <input 
                className="input" 
                type="date" 
                value={formData.expiresAt}
                onChange={e => updateForm('expiresAt', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Program'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Program Modal */}
      <Modal isOpen={!!editProgram} onClose={() => setEditProgram(null)} title={`Edit · ${formatReadable(editProgram?.name)}`} maxWidth={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Program Name</label>
            <input
              className="input"
              placeholder="e.g., Restaurant Growth Program"
              value={editForm.name}
              onChange={e => updateEditForm('name', e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Reward Type</label>
              <select className="input" style={{ cursor: 'pointer' }} value={editForm.rewardType} onChange={e => updateEditForm('rewardType', e.target.value)}>
                <option value="cash">Cash</option>
                <option value="credit">Credit</option>
                <option value="percent">Percentage</option>
              </select>
            </div>
            <div className="input-group">
              <label>Reward Value</label>
              <input className="input" type="number" placeholder="50.00" value={editForm.rewardValue} onChange={e => updateEditForm('rewardValue', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Referred Discount %</label>
              <input className="input" type="number" value={editForm.referredDiscountPercent} onChange={e => updateEditForm('referredDiscountPercent', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Hold Days</label>
              <input className="input" type="number" value={editForm.holdDays} onChange={e => updateEditForm('holdDays', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
            <div className="input-group">
              <label>Min Subscription Months</label>
              <input className="input" type="number" value={editForm.minSubscriptionMonths} onChange={e => updateEditForm('minSubscriptionMonths', e.target.value)} />
            </div>
            <div className="input-group">
              <label>Expiry Date (optional)</label>
              <input className="input" type="date" value={editForm.expiresAt} onChange={e => updateEditForm('expiresAt', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn btn-secondary" onClick={() => setEditProgram(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
