import {
  LayoutDashboard,
  Megaphone,
  QrCode,
  MessageSquareHeart,
  Share2,
  Wallet,
  Shield,
  AlertTriangle,
  FileText,
  Settings,
  Users,
  CreditCard,
  Gift,
  PieChart,
  Volume2,
  PhoneCall,
  Layers,
  Wand2,
} from 'lucide-react';

export const ADMIN_NAV_CONFIG = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/ai-engine', icon: Wand2, label: 'AI Engine' },
    ],
  },
  {
    label: 'QR Review Engine',
    items: [
      { to: '/campaigns',       icon: Megaphone,           label: 'Campaigns' },
      { to: '/qr-codes',        icon: QrCode,              label: 'QR Codes' },
      { to: '/review-intents',  icon: MessageSquareHeart,  label: 'Review Intents' },
      { to: '/voice-thank-you', icon: Volume2,             label: 'AI Voice Thank-You' },
      { to: '/incentives',      icon: Gift,                label: 'Incentives' },
    ],
  },
  {
    label: 'AutoRefer™',
    items: [
      { to: '/referral-programs', icon: Share2, label: 'Referral Programs' },
      { to: '/referral-links', icon: Users, label: 'Referral Links' },
      { to: '/wallets', icon: Wallet, label: 'Wallets' },
      { to: '/payouts', icon: CreditCard, label: 'Payouts' },
    ],
  },
  {
    label: 'Security',
    items: [
      { to: '/fraud-queue', icon: AlertTriangle, label: 'Fraud Queue' },
      { to: '/audit-logs', icon: FileText, label: 'Audit Logs' },
    ],
  },
  {
    label: 'System',
    items: [
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

export const USER_NAV_CONFIG = [
  {
    label: 'My Account',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/ai-engine', icon: Wand2, label: 'AI Engine' },
    ],
  },
  {
    label: 'Promote',
    items: [
      { to: '/referral-programs', icon: Layers,    label: 'Referral Programs' },
      { to: '/referral-links',    icon: Share2,    label: 'My Referral Links' },
      { to: '/incentives',        icon: Gift,      label: 'My Incentives' },
      { to: '/campaigns',         icon: Megaphone, label: 'Available Campaigns' },
      { to: '/qr-codes',          icon: QrCode,    label: 'QR Codes' },
    ],
  },
  {
    label: 'Rewards',
    items: [
      { to: '/wallets', icon: Wallet, label: 'My Wallet' },
      { to: '/payouts', icon: Gift, label: 'Rewards History' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { to: '/settings', icon: Settings, label: 'Profile Settings' },
    ],
  },
];
