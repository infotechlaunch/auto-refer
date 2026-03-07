import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Snowflake, DollarSign, ArrowUpRight, ArrowDownRight, Lock, Unlock, MoreHorizontal } from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import Modal from '../components/shared/Modal';
import { walletsApi, dashboardApi, payoutsApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatRelativeTime } from '../lib/utils';

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [dashboardStats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'stripe_connect',
    notes: ''
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([walletsApi.list(), dashboardApi.get()])
      .then(([walletsRes, dashRes]) => {
        setWallets(walletsRes.data);
        setStats(dashRes.data.stats || {});
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) return alert('Invalid amount');
    
    setIsSubmitting(true);
    try {
      await payoutsApi.request({
        amount: parseFloat(withdrawForm.amount),
        method: withdrawForm.method,
        notes: withdrawForm.notes
      });
      setShowWithdraw(false);
      setWithdrawForm({ amount: '', method: 'stripe_connect', notes: '' });
      fetchData(); // Refresh balances
      alert('Withdrawal request submitted successfully!');
    } catch (err) {
      alert(err.message || 'Failed to request payout');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="page-content">Loading...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1>Referral Wallets</h1>
          <p>Manage referrer wallets — pending, available, and paid balances.</p>
        </div>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowWithdraw(true)}>
            <ArrowUpRight size={16} />
            Withdraw Funds
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        <StatCard
          icon={Wallet}
          label="Total Pending"
          value={formatCurrency(dashboardStats.walletTotalPending)}
          color="warning"
          delay={0}
        />
        <StatCard
          icon={DollarSign}
          label="Total Available"
          value={formatCurrency(dashboardStats.walletTotalAvailable)}
          color="success"
          delay={1}
        />
        <StatCard
          icon={ArrowUpRight}
          label="Total Paid Out"
          value={formatCurrency(dashboardStats.walletTotalPaid)}
          color="primary"
          delay={2}
        />
      </div>

      {/* Wallet Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="table-container"
      >
        <table className="table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Pending</th>
              <th>Available</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Last Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {wallets.map((wallet, idx) => (
              <motion.tr
                key={wallet.walletId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + idx * 0.08 }}
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      background: wallet.frozen ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: wallet.frozen ? 'var(--text-danger)' : 'var(--text-brand)',
                    }}>
                      {wallet.frozen ? <Snowflake size={16} /> : <Wallet size={16} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {wallet.ownerName}
                      </div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {wallet.ownerId}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-warning)' }}>
                    {formatCurrency(wallet.balancePending)}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-success)' }}>
                    {formatCurrency(wallet.balanceAvailable)}
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatCurrency(wallet.balancePaid)}
                  </span>
                </td>
                <td>
                  {wallet.frozen ? (
                    <span className="badge badge-danger">
                      <Snowflake size={10} /> Frozen
                    </span>
                  ) : (
                    <span className="badge badge-success">Active</span>
                  )}
                </td>
                <td style={{ fontSize: '0.8125rem' }}>
                  {formatRelativeTime(wallet.lastAdjustedAt)}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      className={`btn btn-sm ${wallet.frozen ? 'btn-success' : 'btn-danger'}`}
                      title={wallet.frozen ? 'Unfreeze' : 'Freeze'}
                    >
                      {wallet.frozen ? <Unlock size={13} /> : <Lock size={13} />}
                      {wallet.frozen ? 'Unfreeze' : 'Freeze'}
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Adjust">
                      <DollarSign size={14} />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* Withdraw Modal */}
      <Modal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} title="Withdraw Funds" maxWidth={480}>
        <form onSubmit={handleWithdraw} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div className="input-group">
            <label>Amount (USD)</label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                required
                type="number"
                step="0.01"
                className="input" 
                style={{ paddingLeft: 40 }}
                placeholder="0.00"
                value={withdrawForm.amount}
                onChange={e => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Available Balance: {formatCurrency(wallets.find(w => w.ownerId === user.id)?.balanceAvailable || 0)}
            </p>
          </div>

          <div className="input-group">
            <label>Payout Method</label>
            <select 
              className="input"
              value={withdrawForm.method}
              onChange={e => setWithdrawForm({ ...withdrawForm, method: e.target.value })}
            >
              <option value="stripe_connect">Stripe Connect</option>
              <option value="ach">Bank Transfer (ACH)</option>
              <option value="paypal">PayPal</option>
              <option value="manual">Manual Request</option>
            </select>
          </div>

          <div className="input-group">
            <label>Notes (Optional)</label>
            <textarea 
              className="input" 
              style={{ minHeight: 80, paddingTop: 12 }}
              placeholder="Any specific instructions for processing..."
              value={withdrawForm.notes}
              onChange={e => setWithdrawForm({ ...withdrawForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowWithdraw(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
