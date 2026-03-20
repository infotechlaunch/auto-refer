import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Rocket, Zap, QrCode, Volume2, Gift, Share2,
  ChevronRight, CheckCircle2, Globe, Phone, Mail, AtSign, ShieldCheck,
  BarChart3, Users, Star, ArrowRight, Copy, ExternalLink, RefreshCw,
  Lightbulb, TrendingUp, Target, Send, Bot, FileJson, Eye,
  Megaphone, Clock,
} from 'lucide-react';
import { aiEngineApi } from '../lib/api';

// ─── Animated Gradient Text Component ──────────────────────────
function GradientText({ children, style = {} }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #14b8a6, #06b6d4, #8b5cf6)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      fontWeight: 700,
      ...style,
    }}>
      {children}
    </span>
  );
}

// ─── Typing Indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 0' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--brand-primary)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Processing Step Indicator ─────────────────────────────────
function ProcessingStep({ icon: Icon, label, status, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', borderRadius: 10,
        background: status === 'done'
          ? 'rgba(20, 184, 166, 0.08)'
          : status === 'active'
            ? 'rgba(139, 92, 246, 0.08)'
            : 'var(--bg-surface)',
        border: `1px solid ${status === 'done' ? 'rgba(20, 184, 166, 0.2)' : status === 'active' ? 'rgba(139, 92, 246, 0.2)' : 'var(--border-subtle)'}`,
        transition: 'all 0.3s ease',
      }}
    >
      {status === 'done' ? (
        <CheckCircle2 size={18} style={{ color: '#14b8a6', flexShrink: 0 }} />
      ) : status === 'active' ? (
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <RefreshCw size={18} style={{ color: '#8b5cf6', flexShrink: 0 }} />
        </motion.div>
      ) : (
        <Icon size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      )}
      <span style={{
        fontSize: '0.8125rem', fontWeight: 500,
        color: status === 'done' ? '#14b8a6' : status === 'active' ? '#8b5cf6' : 'var(--text-muted)',
      }}>
        {label}
      </span>
    </motion.div>
  );
}

// ─── Result Card ───────────────────────────────────────────────
function ResultCard({ icon: Icon, title, value, subtext, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      style={{
        padding: 20, borderRadius: 16,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', gap: 8,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 60, height: 60,
        background: `${color}10`, borderRadius: '0 0 0 60px',
      }} />
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: `${color}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</div>
      {subtext && <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>{subtext}</div>}
    </motion.div>
  );
}

// ─── Main AI Engine Page ───────────────────────────────────────
export default function AIEnginePage() {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');
  const [showJSON, setShowJSON] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  // Load smart suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    try {
      const res = await aiEngineApi.suggestions();
      if (res.success) setSuggestions(res.data);
    } catch {
      // Silently fail — suggestions are optional
    }
  }

  // Processing steps animation
  const processingSteps = [
    { icon: Bot, label: 'Analyzing your intent...' },
    { icon: Target, label: 'Detecting business type & platform...' },
    { icon: Megaphone, label: 'Creating campaign...' },
    { icon: QrCode, label: 'Generating QR code...' },
    { icon: Volume2, label: 'Setting up automation flows...' },
    { icon: Gift, label: 'Configuring incentives...' },
    { icon: BarChart3, label: 'Building dashboard metrics...' },
    { icon: CheckCircle2, label: 'Done! Campaign is live.' },
  ];

  async function handleGenerate(e) {
    e?.preventDefault();
    if (!prompt.trim() || isProcessing) return;

    setError('');
    setResult(null);
    setIsProcessing(true);
    setProcessingStep(0);
    setShowJSON(false);

    // Animate through processing steps
    const stepInterval = setInterval(() => {
      setProcessingStep((prev) => {
        if (prev >= processingSteps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }
        return prev + 1;
      });
    }, 600);

    try {
      const res = await aiEngineApi.generate(prompt);
      clearInterval(stepInterval);
      setProcessingStep(processingSteps.length - 1);

      if (res.success) {
        // Small delay for final "Done" step to show
        setTimeout(() => {
          setResult(res.data);
          setIsProcessing(false);
        }, 800);
      } else {
        setError(res.error || 'Something went wrong.');
        setIsProcessing(false);
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.message || 'Failed to generate campaign.');
      setIsProcessing(false);
    }
  }

  function handleSuggestionClick(text) {
    setPrompt(text);
    setResult(null);
    setError('');
    inputRef.current?.focus();
  }

  function handleCopyJSON() {
    if (!result) return;
    const json = {
      campaignName: result.campaignName,
      campaignType: result.campaignType,
      platform: result.platform,
      qrCodeLink: result.qrCodeLink,
      formFields: result.formFields,
      automationFlows: result.automationFlows,
      incentives: result.incentives,
      status: result.status,
    };
    navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const platformColors = {
    google: '#4285f4',
    facebook: '#1877f2',
    yelp: '#d32323',
    tripadvisor: '#00aa6c',
    trustpilot: '#00b67a',
    instagram: '#e1306c',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
          }}>
            <Wand2 size={22} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              AI <GradientText>Automation Engine</GradientText>
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>
              Describe your campaign in plain English — we'll build everything automatically.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Prompt Input ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          background: 'var(--bg-surface)',
          borderRadius: 20,
          border: '1px solid var(--border-subtle)',
          padding: 24,
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative gradient border */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #14b8a6, #06b6d4, #8b5cf6, #ec4899)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Sparkles size={16} style={{ color: '#8b5cf6' }} />
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            What would you like to automate?
          </span>
        </div>

        <form onSubmit={handleGenerate} style={{ display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, position: 'relative',
            background: 'var(--bg-input, var(--bg-hover))',
            borderRadius: 14, border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}>
            <textarea
              ref={inputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleGenerate();
                }
              }}
              placeholder="e.g. Create a campaign for my restaurant to collect Google reviews with QR code and send thank-you voice message..."
              rows={3}
              style={{
                width: '100%', padding: '14px 16px',
                border: 'none', outline: 'none', resize: 'none',
                fontSize: '0.9375rem', lineHeight: 1.6,
                background: 'transparent',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!prompt.trim() || isProcessing}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '0 28px', borderRadius: 14,
              background: (!prompt.trim() || isProcessing)
                ? 'var(--text-muted)'
                : 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 600,
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
              opacity: (!prompt.trim() || isProcessing) ? 0.5 : 1,
              minWidth: 140, alignSelf: 'stretch',
              transition: 'opacity 0.2s ease',
            }}
          >
            {isProcessing ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw size={16} />
                </motion.div>
                Processing...
              </>
            ) : (
              <>
                <Rocket size={16} />
                Generate
              </>
            )}
          </motion.button>
        </form>
      </motion.div>

      {/* ── Processing Animation ── */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'var(--bg-surface)',
              borderRadius: 20, border: '1px solid var(--border-subtle)',
              padding: 24, marginBottom: 24, overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                <Zap size={18} style={{ color: '#8b5cf6' }} />
              </motion.div>
              <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                AutoRefer AI is working...
              </span>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {processingSteps.map((step, i) => (
                <ProcessingStep
                  key={i}
                  icon={step.icon}
                  label={step.label}
                  status={i < processingStep ? 'done' : i === processingStep ? 'active' : 'pending'}
                  delay={i * 0.08}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Message ── */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              padding: 16, borderRadius: 12, marginBottom: 24,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444', fontSize: '0.875rem',
            }}
          >
            ⚠️ {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Result Dashboard ── */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Success Header */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08), rgba(139, 92, 246, 0.08))',
              borderRadius: 20, border: '1px solid rgba(20, 184, 166, 0.15)',
              padding: 24, marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(20, 184, 166, 0.3)',
                  }}>
                    <CheckCircle2 size={24} color="white" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {result.campaignName}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600,
                        background: 'rgba(20, 184, 166, 0.15)', color: '#14b8a6',
                        padding: '2px 10px', borderRadius: 999,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>
                        {result.status}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600,
                        background: `${platformColors[result.platform] || '#4285f4'}20`,
                        color: platformColors[result.platform] || '#4285f4',
                        padding: '2px 10px', borderRadius: 999,
                        textTransform: 'capitalize',
                      }}>
                        {result.platform}
                      </span>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 600,
                        background: 'rgba(139, 92, 246, 0.12)',
                        color: '#8b5cf6',
                        padding: '2px 10px', borderRadius: 999,
                        textTransform: 'capitalize',
                      }}>
                        {result.campaignType}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowJSON(!showJSON)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 10,
                      background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.8125rem', fontWeight: 500,
                    }}
                  >
                    {showJSON ? <Eye size={14} /> : <FileJson size={14} />}
                    {showJSON ? 'Hide' : 'View'} JSON
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCopyJSON}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 10,
                      background: copied ? '#14b8a6' : 'var(--bg-surface)',
                      border: `1px solid ${copied ? '#14b8a6' : 'var(--border-subtle)'}`,
                      color: copied ? 'white' : 'var(--text-secondary)', cursor: 'pointer',
                      fontSize: '0.8125rem', fontWeight: 500,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Copy size={14} />
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </motion.button>
                </div>
              </div>
            </div>

            {/* JSON Output (collapsible) */}
            <AnimatePresence>
              {showJSON && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ marginBottom: 24, overflow: 'hidden' }}
                >
                  <div style={{
                    background: '#0f172a', borderRadius: 16,
                    padding: 20, overflow: 'auto', maxHeight: 400,
                  }}>
                    <pre style={{
                      color: '#e2e8f0', fontSize: '0.8125rem',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap',
                    }}>
                      {JSON.stringify({
                        campaignName: result.campaignName,
                        campaignType: result.campaignType,
                        platform: result.platform,
                        qrCodeLink: result.qrCodeLink,
                        formFields: result.formFields,
                        automationFlows: result.automationFlows,
                        incentives: result.incentives,
                        status: result.status,
                      }, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Metrics Overview */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16, marginBottom: 24,
            }}>
              <ResultCard icon={QrCode} title="QR Code" value={result.qrShortCode} subtext={result.qrCodeLink} color="#14b8a6" delay={0.1} />
              <ResultCard icon={Globe} title="Platform" value={result.platform ? (result.platform.charAt(0).toUpperCase() + result.platform.slice(1)) : 'General'} subtext={`${result.campaignType} campaign`} color={platformColors[result.platform] || '#4285f4'} delay={0.2} />
              <ResultCard icon={Zap} title="Automations" value={result.automationFlows.length} subtext="Active flows configured" color="#8b5cf6" delay={0.3} />
              <ResultCard icon={Gift} title="Incentives" value={result.incentives.enabled ? 'Active' : 'Disabled'} subtext={result.incentives.label || 'Not configured'} color="#f59e0b" delay={0.4} />
              {result.referral && (
                <ResultCard icon={Share2} title="Referral" value={result.referral.code} subtext="Referral link active" color="#06b6d4" delay={0.5} />
              )}
            </div>

            {/* Detailed Sections */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
              {/* Form Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                  background: 'var(--bg-surface)', borderRadius: 16,
                  border: '1px solid var(--border-subtle)', padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Users size={16} style={{ color: '#14b8a6' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Customer Form Fields
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.formFields.map((field, i) => {
                    const icons = { name: Users, phone: Phone, email: Mail, social_handle: AtSign, consent: ShieldCheck };
                    const FieldIcon = icons[field.name] || Users;
                    return (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10,
                          background: field.enabled ? 'rgba(20, 184, 166, 0.04)' : 'var(--bg-hover)',
                          border: `1px solid ${field.enabled ? 'rgba(20, 184, 166, 0.1)' : 'var(--border-subtle)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FieldIcon size={14} style={{ color: field.enabled ? '#14b8a6' : 'var(--text-muted)' }} />
                          <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {field.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {field.required && (
                            <span style={{
                              fontSize: '0.625rem', fontWeight: 600, background: 'rgba(239, 68, 68, 0.1)',
                              color: '#ef4444', padding: '1px 6px', borderRadius: 4,
                            }}>
                              Required
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.625rem', fontWeight: 600,
                            background: field.enabled ? 'rgba(20, 184, 166, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                            color: field.enabled ? '#14b8a6' : '#64748b',
                            padding: '1px 6px', borderRadius: 4,
                          }}>
                            {field.enabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Automation Flows */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  background: 'var(--bg-surface)', borderRadius: 16,
                  border: '1px solid var(--border-subtle)', padding: 20,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Zap size={16} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Automation Flows
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {result.automationFlows.map((flow, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '14px 16px', borderRadius: 12,
                        background: 'rgba(139, 92, 246, 0.04)',
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: flow.enabled ? '#14b8a6' : '#94a3b8',
                          }} />
                          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {flow.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.625rem', fontWeight: 600,
                          background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6',
                          padding: '2px 8px', borderRadius: 4,
                        }}>
                          {flow.trigger.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                        {flow.description}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Incentive Details (if enabled) */}
            {result.incentives.enabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06), rgba(236, 72, 153, 0.06))',
                  borderRadius: 16, border: '1px solid rgba(245, 158, 11, 0.15)',
                  padding: 20, marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Gift size={16} style={{ color: '#f59e0b' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Incentive Configuration
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Type', value: result.incentives.type },
                    { label: 'Value', value: result.incentives.value },
                    { label: 'Description', value: result.incentives.label },
                    { label: 'Delivery', value: result.incentives.deliveryMethod },
                    { label: 'Expires In', value: `${result.incentives.expiresInDays} days` },
                    { label: 'Approval', value: result.incentives.requiresApproval ? 'Required' : 'Auto' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
 
            {/* Referral Details (if enabled) */}
            {result.referral && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.06), rgba(139, 92, 246, 0.06))',
                  borderRadius: 16, border: '1px solid rgba(6, 182, 212, 0.15)',
                  padding: 20, marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Share2 size={16} style={{ color: '#06b6d4' }} />
                  <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    Referral Program Details
                  </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Program ID', value: result.referral.programId.substring(0, 8) + '...' },
                    { label: 'Referral Code', value: result.referral.code },
                    { label: 'Share Link', value: result.referral.shareUrl },
                    { label: 'Commission', value: '$10.00' },
                    { label: 'Reward Type', value: 'Cash' },
                    { label: 'Status', value: 'Active' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '10px 14px', borderRadius: 10, background: 'var(--bg-surface)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: 2 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Tracking Metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              style={{
                background: 'var(--bg-surface)', borderRadius: 16,
                border: '1px solid var(--border-subtle)', padding: 20, marginBottom: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <BarChart3 size={16} style={{ color: '#06b6d4' }} />
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Tracking Metrics (Live)
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {[
                  { icon: QrCode, label: 'Total Scans', value: result.trackingMetrics.totalScans, color: '#14b8a6' },
                  { icon: Star, label: 'Reviews', value: result.trackingMetrics.totalReviews, color: '#f59e0b' },
                  { icon: Volume2, label: 'Calls', value: result.trackingMetrics.totalCalls, color: '#8b5cf6' },
                  { icon: Gift, label: 'Incentives Sent', value: result.trackingMetrics.totalIncentivesSent, color: '#ec4899' },
                  { icon: Share2, label: 'Referrals', value: result.trackingMetrics.totalReferrals, color: '#06b6d4' },
                  { icon: TrendingUp, label: 'Conversion', value: result.trackingMetrics.conversionRate, color: '#10b981' },
                ].map((metric, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center', padding: '14px 10px', borderRadius: 12,
                      background: `${metric.color}06`, border: `1px solid ${metric.color}15`,
                    }}
                  >
                    <metric.icon size={18} style={{ color: metric.color, marginBottom: 6 }} />
                    <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {metric.value}
                    </div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {metric.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* New Campaign Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setResult(null); setPrompt(''); setError(''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 28px', borderRadius: 14,
                  background: 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
                  color: 'white', border: 'none', cursor: 'pointer',
                  fontSize: '0.875rem', fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                }}
              >
                <Sparkles size={16} />
                Generate Another Campaign
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Suggestions (shown when no result) ── */}
      {!result && !isProcessing && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Lightbulb size={16} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Quick Start Templates
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {suggestions.map((category, ci) => (
              <motion.div
                key={ci}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + ci * 0.08 }}
                style={{
                  background: 'var(--bg-surface)', borderRadius: 16,
                  border: '1px solid var(--border-subtle)', padding: 18,
                  transition: 'border-color 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.3)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.25rem' }}>{category.icon}</span>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {category.category}
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {category.prompts.map((p, pi) => (
                    <button
                      key={pi}
                      onClick={() => handleSuggestionClick(p)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'var(--bg-hover)', border: '1px solid transparent',
                        textAlign: 'left', cursor: 'pointer',
                        fontSize: '0.8125rem', color: 'var(--text-secondary)',
                        lineHeight: 1.5, transition: 'all 0.2s ease',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(20, 184, 166, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.15)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }}
                    >
                      <ArrowRight size={12} style={{ flexShrink: 0, opacity: 0.5 }} />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
