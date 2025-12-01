/**
 * Photo Proof Design System
 * Single source of truth for all design tokens
 * Brisk CRM Inspired Theme - Modern, Clean, Professional
 * Modify colors here and restart dev server
 */

// ============================================
// TYPOGRAPHY CONFIGURATION
// ============================================
export const typography = {
  // Font families
  fonts: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    display: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  
  // Font sizes with line heights
  sizes: {
    xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },  // 14px
    base: { size: '1rem', lineHeight: '1.5rem' },     // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },  // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },   // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },    // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' }, // 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px
  },
  
  // Font weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
  },
  
  // Typography options for onboarding (configurable)
  options: [
    { id: 'inter', name: 'Modern (Inter)', fontFamily: "'Inter', system-ui, sans-serif" },
    { id: 'poppins', name: 'Friendly (Poppins)', fontFamily: "'Poppins', sans-serif" },
    { id: 'playfair', name: 'Classic (Playfair Display)', fontFamily: "'Playfair Display', serif" },
    { id: 'lora', name: 'Elegant (Lora)', fontFamily: "'Lora', serif" },
    { id: 'work-sans', name: 'Minimal (Work Sans)', fontFamily: "'Work Sans', sans-serif" },
    { id: 'system', name: 'System Default', fontFamily: "system-ui, -apple-system, sans-serif" },
  ],
};

// ============================================
// COLOR PALETTE - BRISK CRM INSPIRED
// ============================================
export const colors = {
  // Primary Brand Colors (Teal-Blue like Brisk)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',   // Main primary - Brisk teal
    600: '#0284c7',   // Hover state
    700: '#0369a1',   // Active state
    800: '#075985',
    900: '#0c4a6e',
  },
  
  // Studio Dashboard Theme - SINGLE SOURCE OF TRUTH
  studio: {
    primary: '#0a58d0',        // Main button/accent color
    primaryHover: '#0847a8',   // Hover state (darker)
    primaryActive: '#063a8c',  // Active/pressed state
    primaryLight: '#e8f1fc',   // Light backgrounds
    primaryLighter: '#f0f7ff', // Very light backgrounds
    secondary: '#64748b',      // Slate-600
    accent: '#10b981',         // Emerald-500 - success
    warning: '#f59e0b',        // Amber-500
    danger: '#ef4444',         // Red-500
  },
  
  // Sidebar Theme (Light)
  sidebar: {
    bg: '#ffffff',             // White background
    border: '#e2e8f0',         // Light border
    text: '#475569',           // Default text
    textMuted: '#94a3b8',      // Muted text
    textHover: '#0f172a',      // Hover text
    itemHover: '#f1f5f9',      // Item hover bg
    itemActive: '#0a58d0',     // Active item bg (uses primary)
    itemActiveText: '#ffffff', // Active item text
  },

  // Client Pages (Photo-Centric Neutral)
  client: {
    primary: '#0f172a',        // Slate-900
    primaryLight: '#1e293b',   // Slate-800
    accent: '#0ea5e9',         // Teal - matches studio
    accentLight: '#38bdf8',    // Lighter teal
    background: '#f8fafc',     // Slate-50
    cardBg: '#ffffff',
  },

  // E-commerce Store (Action-Oriented)
  store: {
    primary: '#0ea5e9',        // Trust teal (matches studio)
    secondary: '#8b5cf6',      // Violet-500 - premium
    accent: '#f97316',         // Orange-500 - urgency
    accentHover: '#ea580c',    // Orange-600
    success: '#10b981',
    priceColor: '#059669',     // Emerald-600
  },

  // Semantic Colors (Status)
  semantic: {
    success: '#10b981',        // Green - Won, Complete
    successLight: '#d1fae5',
    warning: '#f59e0b',        // Amber - Pending, In Progress
    warningLight: '#fef3c7',
    error: '#ef4444',          // Red - Lost, Failed
    errorLight: '#fee2e2',
    info: '#3b82f6',           // Blue - Discovery, Info
    infoLight: '#dbeafe',
  },
  
  // Status Pills (Brisk-style)
  status: {
    won: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
    lost: { bg: '#fee2e2', text: '#dc2626', border: '#fca5a5' },
    leads: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    discovery: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    inProgress: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    pending: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
    draft: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
    sent: { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
    paid: { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  },

  // Neutral Grays (Clean, modern)
  gray: {
    50: '#f8fafc',   // Background
    100: '#f1f5f9',  // Surface
    200: '#e2e8f0',  // Border
    300: '#cbd5e1',  // Disabled
    400: '#94a3b8',  // Muted text
    500: '#64748b',  // Secondary text
    600: '#475569',  // Body text
    700: '#334155',  // Heading
    800: '#1e293b',  // Dark
    900: '#0f172a',  // Darkest
    950: '#020617',  // Near black
  },
  
  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    sidebar: '#0f172a',
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  
  // Border colors
  border: {
    light: '#e2e8f0',
    default: '#cbd5e1',
    dark: '#94a3b8',
    focus: '#0ea5e9',
  },
  
  // Text colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
    link: '#0ea5e9',
    linkHover: '#0284c7',
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  6: '1.5rem',     // 24px
  8: '2rem',       // 32px
  12: '3rem',      // 48px
  16: '4rem',      // 64px
  20: '5rem',      // 80px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',  // Perfect circle
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
};

// BUTTON SPECIFICATIONS
export const buttons = {
  sm: {
    height: '32px',
    padding: '8px 12px',
    fontSize: '14px',
    borderRadius: borderRadius.md,
    fontWeight: 500,
  },
  md: {
    height: '40px',
    padding: '12px 20px',
    fontSize: '16px',
    borderRadius: borderRadius.lg,
    fontWeight: 600,
  },
  lg: {
    height: '48px',         // RECOMMENDED for CTAs
    padding: '16px 28px',
    fontSize: '16px',
    borderRadius: borderRadius.lg,
    fontWeight: 600,
  },
  xl: {
    height: '56px',
    padding: '18px 32px',
    fontSize: '18px',
    borderRadius: borderRadius.xl,
    fontWeight: 700,
  },
};

// DROPDOWN SPECIFICATIONS
export const dropdowns = {
  trigger: {
    height: '40px',
    padding: '0 12px',
    borderRadius: borderRadius.lg,
    fontSize: '16px',
  },
  menu: {
    borderRadius: borderRadius.lg,
    maxHeight: '320px',
    padding: '4px',
    marginTop: '4px',
    shadow: shadows.lg,
  },
  item: {
    height: '36px',
    padding: '0 12px',
    borderRadius: borderRadius.md,
    fontSize: '15px',
  },
};

// ANIMATIONS - Brisk-style smooth transitions
export const animations = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeInOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

// CARD STYLES
export const cards = {
  default: {
    background: colors.background.primary,
    border: `1px solid ${colors.border.light}`,
    borderRadius: borderRadius.xl,
    shadow: shadows.sm,
    hoverShadow: shadows.lg,
  },
  elevated: {
    background: colors.background.primary,
    border: 'none',
    borderRadius: borderRadius.xl,
    shadow: shadows.md,
    hoverShadow: shadows.xl,
  },
};

// STATUS PILL STYLES
export const statusPills = {
  sm: {
    padding: '2px 8px',
    fontSize: '11px',
    borderRadius: borderRadius.full,
    fontWeight: 500,
  },
  md: {
    padding: '4px 12px',
    fontSize: '12px',
    borderRadius: borderRadius.full,
    fontWeight: 500,
  },
  lg: {
    padding: '6px 16px',
    fontSize: '14px',
    borderRadius: borderRadius.full,
    fontWeight: 600,
  },
};

// METRIC CARD STYLES (Brisk-style)
export const metricCards = {
  container: {
    padding: '24px',
    borderRadius: borderRadius.xl,
    background: colors.background.primary,
    border: `1px solid ${colors.border.light}`,
  },
  value: {
    fontSize: '2.25rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: colors.text.primary,
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: colors.text.secondary,
  },
  delta: {
    positive: {
      color: colors.semantic.success,
      background: colors.semantic.successLight,
    },
    negative: {
      color: colors.semantic.error,
      background: colors.semantic.errorLight,
    },
  },
};

// SIDEBAR STYLES (Light Theme)
export const sidebarStyles = {
  width: {
    expanded: '256px',
    collapsed: '80px',
  },
  background: colors.sidebar.bg,
  border: colors.sidebar.border,
  item: {
    height: '40px',
    padding: '8px 12px',
    borderRadius: borderRadius.lg,
    fontSize: '14px',
    fontWeight: 500,
    color: colors.sidebar.text,
  },
  activeItem: {
    background: colors.sidebar.itemActive,
    color: colors.sidebar.itemActiveText,
  },
  hoverItem: {
    background: colors.sidebar.itemHover,
    color: colors.sidebar.textHover,
  },
};

export const designSystem = {
  typography,
  colors,
  spacing,
  borderRadius,
  shadows,
  buttons,
  dropdowns,
  animations,
  cards,
  statusPills,
  metricCards,
  sidebar: sidebarStyles,
};

export default designSystem;
