import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 560 }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Panel Container */}
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 101,
            pointerEvents: 'none',
            padding: '20px',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '100%',
                maxWidth,
                maxHeight: 'min(90vh, 800px)',
                display: 'flex',
                flexDirection: 'column',
                background: 'var(--bg-surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                pointerEvents: 'auto',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface-raised)',
                zIndex: 10,
              }}>
                <h3 style={{
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}>
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: 6 }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content (Scrollable) */}
              <div style={{ 
                padding: '24px',
                overflowY: 'auto',
                flex: 1,
                // Custom scrollbar
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--border-default) transparent',
              }} className="custom-scrollbar">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
