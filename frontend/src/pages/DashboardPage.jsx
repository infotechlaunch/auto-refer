import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import {
  QrCode, MessageSquareHeart, CheckCircle2, Share2, Users, Wallet,
  AlertTriangle, TrendingUp, MousePointerClick, CreditCard, Clock, Shield,
  Megaphone, Volume2, Gift, PhoneCall, PhoneOff, PlayCircle,
  DollarSign, Hourglass,
} from 'lucide-react';
import StatCard from '../components/shared/StatCard';
import StatusBadge from '../components/shared/StatusBadge';
import { useEffect, useState } from 'react';
import { dashboardApi } from '../lib/api';
import { formatCurrency, formatRelativeTime } from '../lib/utils';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload) return null;
  return (
    <div style={{
      background: 'var(--bg-surface-overlay)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      fontSize: '0.8125rem',
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}: </span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    dashboardApi.get()
      .then(res => setData(res.data))
      .catch(err => {
        console.error(err);
        setError(err.message || 'Failed to load dashboard data');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="page-content">Loading dashboard...</div>;
  if (error) return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-danger)', marginBottom: 16 }}>
        <AlertTriangle size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Error Loading Dashboard</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{error}</p>
      </div>
      <button className="btn btn-primary" onClick={fetchData}>
        Retry Loading
      </button>
    </div>
  );
  if (!data) return <div className="page-content">No data available.</div>;

  const {
    stats,
    scanChartData,
    referralChartData,
    recentEvents,
    recentVoiceEvents,
    pendingRewards,
    fraudAlerts
  } = data;

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Monitor your QR Review Engine & AutoRefer™ performance at a glance.</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stat-grid" style={{ marginBottom: 'var(--space-2xl)' }}>
        <StatCard 
          icon={Megaphone} 
          label="Total Campaigns" 
          value={stats.totalCampaigns || 0} 
          color="primary" 
          delay={0} 
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Total Reviews Received" 
          value={stats.completedThankYous || 0} 
          color="success" 
          delay={1} 
        />
        <StatCard 
          icon={Volume2} 
          label="AI Voice Thank-Yous" 
          value={stats.voiceThankYous || 0} 
          color="info" 
          delay={2} 
        />
        <StatCard 
          icon={Wallet} 
          label="Referral Earnings" 
          value={formatCurrency(stats.referralEarnings || 0)} 
          color="secondary" 
          delay={3} 
        />
      </div>

      {/* Alerts / Notifications */}
      {stats.totalFraudFlagged > 0 && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ 
            padding: '12px 20px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 'var(--space-xl)',
            color: '#ef4444',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <AlertTriangle size={18} />
          <span>Priority Alert: {stats.totalFraudFlagged} potential fraud flags detected in your referral program.</span>
        </motion.div>
      )}

      {/* ── Step 6: Voice Thank-You Stats Row ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Volume2 size={16} style={{ color: 'var(--brand-info)' }} />
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
            AI Voice Thank-You (Step 6)
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)' }}>
          {[
            { label: 'Total Call Events', value: stats.totalCallEvents || 0, color: 'var(--brand-primary)' },
            { label: 'Thank-Yous Played', value: stats.voiceThankYous  || 0, color: 'var(--brand-success)' },
            { label: 'Calls Skipped',     value: stats.voiceSkipped    || 0, color: 'var(--text-muted)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.label.includes('Played') ? <PlayCircle size={18} style={{ color: s.color }} /> :
                 s.label.includes('Skipped') ? <PhoneOff size={18} style={{ color: s.color }} /> :
                 <PhoneCall size={18} style={{ color: s.color }} />}
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Step 7 + 8: Incentives & Referral Reward Stats Row ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          {/* Incentives (Step 7) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Gift size={16} style={{ color: 'var(--brand-warning)' }} />
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Incentives (Step 7)
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { label: 'Pending',  value: stats.incentivesPending  || 0, color: 'var(--brand-warning)' },
                { label: 'Sent',     value: stats.incentivesSent     || 0, color: 'var(--brand-info)' },
                { label: 'Redeemed', value: stats.incentivesRedeemed || 0, color: 'var(--brand-success)' },
                { label: 'Total',    value: stats.incentivesTotal    || 0, color: 'var(--text-muted)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Referral Rewards (Step 8) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <DollarSign size={16} style={{ color: 'var(--brand-success)' }} />
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-secondary)', margin: 0 }}>
                Referral Rewards (Step 8)
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { label: 'Pending Rewards',    value: stats.rewardsPending   || 0, color: 'var(--brand-warning)', isCurrency: false },
                { label: 'Released Rewards',   value: stats.rewardsReleased  || 0, color: 'var(--brand-success)', isCurrency: false },
                { label: 'Wallet Available',   value: formatCurrency(stats.walletAvailable || 0), color: 'var(--brand-success)' },
                { label: 'Total Earnings',     value: formatCurrency(stats.referralEarnings || 0), color: 'var(--brand-primary)' },
              ].map(s => (
                <div key={s.label} className="card" style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        {/* QR Scan Performance */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3>QR Scan → Intent → Thank-You</h3>
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(!scanChartData || scanChartData.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <Clock size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>No scan data available yet.<br/>Create a campaign to start tracking.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={scanChartData}>
                  <defs>
                    <linearGradient id="gradScans" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradIntents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradThanked" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="scans" stroke="#6366f1" fill="url(#gradScans)" strokeWidth={2} name="Scans" />
                  <Area type="monotone" dataKey="intents" stroke="#06b6d4" fill="url(#gradIntents)" strokeWidth={2} name="Intents" />
                  <Area type="monotone" dataKey="thanked" stroke="#10b981" fill="url(#gradThanked)" strokeWidth={2} name="Thanked" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Referral Funnel */}
        <motion.div
          className="chart-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3>Referral Funnel</h3>
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {(!referralChartData || referralChartData.length === 0) ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <TrendingUp size={32} style={{ opacity: 0.2, marginBottom: 8 }} />
                <p>No referral data available yet.<br/>Enable referrals in your campaigns.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={referralChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} />
                  <Bar dataKey="clicks" fill="#6366f180" radius={[4, 4, 0, 0]} name="Clicks" />
                  <Bar dataKey="signups" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Signups" />
                  <Bar dataKey="paid" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Paid" />
                  <Bar dataKey="released" fill="#10b981" radius={[4, 4, 0, 0]} name="Released" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity + Voice Events + Fraud Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-lg)' }}>
        {/* Recent Referral Events */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>Recent Referral Events</h3>
            <span className="badge badge-info">{recentEvents.length} events</span>
          </div>
          <div>
            {recentEvents.length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No events yet</div>
            ) : recentEvents.slice(0, 5).map((event) => (
              <div
                key={event.eventId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {event.referredBusinessId.replace('b_', '').replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formatRelativeTime(event.eventTs)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {event.amount > 0 && (
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatCurrency(event.amount)}
                    </span>
                  )}
                  <StatusBadge status={event.status} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Voice Thank-You Events */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75 }}
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              <Volume2 size={14} style={{ marginRight: 6, verticalAlign: 'middle', color: 'var(--brand-info)' }} />
              Voice Thank-Yous
            </h3>
            <span className="badge badge-info">{(recentVoiceEvents || []).length}</span>
          </div>
          <div>
            {(!recentVoiceEvents || recentVoiceEvents.length === 0) ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No call events yet
              </div>
            ) : recentVoiceEvents.map((ev) => (
              <div key={ev.eventId} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: ev.played ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                }}>
                  {ev.played
                    ? <PlayCircle size={13} style={{ color: 'var(--brand-success)' }} />
                    : <PhoneOff  size={13} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.played ? `Played (${ev.scriptVariant?.replace('_', ' ') || 'standard'})` : `Skipped — ${ev.skipReason || 'no match'}`}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {ev.campaignName} · {formatRelativeTime(ev.callTs)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Fraud Alerts */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              <Shield size={16} style={{ marginRight: 8, verticalAlign: 'middle', color: 'var(--text-danger)' }} />
              Fraud Alerts
            </h3>
            <span className="badge badge-danger">{fraudAlerts.filter(f => !f.resolved).length} open</span>
          </div>
          <div>
            {fraudAlerts.filter(f => !f.resolved).length === 0 ? (
              <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No active fraud alerts</div>
            ) : fraudAlerts.filter(f => !f.resolved).map((item) => (
              <div
                key={item.signalId}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.referredName}
                  </span>
                  <span style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: item.totalScore >= 90 ? 'var(--text-danger)' : 'var(--text-warning)',
                  }}>
                    Score: {item.totalScore}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {item.flags.map((f, i) => (
                    <span
                      key={i}
                      className={`badge ${item.totalScore >= 90 ? 'badge-danger' : 'badge-warning'}`}
                      style={{ fontSize: '0.6875rem' }}
                    >
                      {f.type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
                  Referrer: {item.referrerName} · {formatRelativeTime(item.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
