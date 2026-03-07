import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, subtitle, trend, trendUp, color = 'var(--brand-primary)', delay = 0 }) {
  const colorMap = {
    primary: 'var(--brand-primary)',
    success: 'var(--brand-success)',
    warning: 'var(--brand-warning)',
    danger: 'var(--brand-danger)',
    info: 'var(--brand-info)',
    secondary: 'var(--brand-secondary)',
  };

  const resolvedColor = colorMap[color] || color;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="stat-card"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* Top gradient line */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: `linear-gradient(90deg, ${resolvedColor}, transparent)`,
        opacity: 0.6,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 'var(--radius-md)',
          background: `${resolvedColor}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: resolvedColor,
        }}>
          {Icon && <Icon size={20} />}
        </div>

        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.75rem',
            fontWeight: 600,
            color: trendUp ? 'var(--text-success)' : 'var(--text-danger)',
            background: trendUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
          }}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>

      <div style={{
        fontSize: '1.75rem',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.02em',
        marginBottom: 4,
      }}>
        {value}
      </div>

      <div style={{
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
      }}>
        {label}
      </div>

      {subtitle && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: 4,
          opacity: 0.7,
        }}>
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}
