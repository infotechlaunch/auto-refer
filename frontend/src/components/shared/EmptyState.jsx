import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="empty-state"
    >
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={28} />
        </div>
      )}
      <h3 style={{
        fontSize: '1.125rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          maxWidth: 360,
        }}>
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: 8 }}>
          {action}
        </div>
      )}
    </motion.div>
  );
}
