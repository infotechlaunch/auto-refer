import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import logo from '../../assets/main-logos/logo.svg';

// Neural network canvas background for the left panel
function NeuralBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 800,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${0.15 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.fill();

        // Update position
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w()) p.vx *= -1;
        if (p.y < 0 || p.y > h()) p.vy *= -1;
      });

      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        opacity: 0.6,
      }}
    />
  );
}

// AutoRefer Logo SVG
function AutoReferLogo({ size = 64 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <img src={logo} alt="AutoRefer Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>
  );
}

// Split layout for login pages
function SplitLayout({ children, title, subtitle }) {
  return (
    <div className="auth-split-layout">
      {/* Left Panel - Branding */}
      <motion.div
        className="auth-left-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <NeuralBackground />
        
        {/* Gradient overlays */}
        <div className="auth-left-gradient-1" />
        <div className="auth-left-gradient-2" />

        <div className="auth-left-content">
          {/* Logo */}
          <motion.div
            className="auth-logo-group"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <AutoReferLogo size={64} />
            <span className="auth-logo-text">AutoRefer™</span>
          </motion.div>

          {/* Hero Text */}
          <motion.div
            className="auth-hero-section"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span className="auth-badge-tag">AUTONOMOUS GROWTH ENGINE</span>
            <h1 className="auth-hero-title">
              AI-Powered<br />
              <span className="auth-hero-highlight">Growth.</span>
            </h1>
            <p className="auth-hero-desc">
              Harness the power of autonomous marketing
              operations. Scalable, secure, and driven by
              industry-leading predictive intelligence.
            </p>
          </motion.div>

          {/* Trust Badge */}
          <motion.div
            className="auth-trust-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <div className="auth-avatar-stack">
              <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', marginLeft: -8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="auth-avatar" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', marginLeft: -8 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <div className="auth-avatar auth-avatar-count" style={{ marginLeft: -8 }}>
                +2k
              </div>
            </div>
            <span className="auth-trust-text">Trusted by 2,000+ high-growth companies.</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Right Panel - Form */}
      <motion.div
        className="auth-right-panel"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="auth-right-content">
          <div className="auth-form-header">
            <h2 className="auth-form-title">{title}</h2>
            {subtitle && <p className="auth-form-subtitle">{subtitle}</p>}
          </div>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

// Card layout for register pages
function CardLayout({ children, title, subtitle, type = 'user' }) {
  const isUser = type === 'user';
  const accentGradient = isUser
    ? 'from-indigo-500 via-purple-500 to-pink-500'
    : 'from-cyan-500 via-blue-500 to-indigo-500';

  return (
    <div className="auth-card-layout">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[120px] bg-gradient-to-br ${accentGradient}`} />
        <div className={`absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-10 blur-[100px] bg-gradient-to-bl ${accentGradient}`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        <div className="auth-card">
          {/* Top accent line */}
          <div className="auth-card-accent" />

          {/* Header */}
          <div className="auth-card-header">
            <h1 className="auth-card-title">{title}</h1>
            {subtitle && <p className="auth-card-subtitle">{subtitle}</p>}
          </div>

          {/* Content */}
          <div className="relative z-10">
            {children}
          </div>

          {/* Bottom glow */}
          <div className={`absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-br ${accentGradient} opacity-10 blur-3xl rounded-full pointer-events-none`} />
        </div>

        {/* Footer */}
        <div className="auth-card-footer">
          <p>© 2024 AutoRefer. All rights reserved.</p>
          <div className="auth-card-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Help</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function AuthLayout({ children, title, subtitle, type = 'user', layout = 'split' }) {
  if (layout === 'card') {
    return <CardLayout title={title} subtitle={subtitle} type={type}>{children}</CardLayout>;
  }
  return <SplitLayout title={title} subtitle={subtitle}>{children}</SplitLayout>;
}

export { SplitLayout, CardLayout, AutoReferLogo };
