/**
 * Photo Proof Design System
 * Single source of truth for all design tokens
 * Modify colors here and restart dev server
 */

export const colors = {
  // Studio Dashboard (Professional Blue)
  studio: {
    primary: '#2563eb',        // Blue-600
    primaryLight: '#3b82f6',   // Blue-500 - hover
    primaryDark: '#1d4ed8',    // Blue-700 - active
    secondary: '#64748b',      // Slate-600
    accent: '#10b981',         // Emerald-500 - success
    warning: '#f59e0b',        // Amber-500
    danger: '#ef4444',         // Red-500
  },

  // Client Pages (Photo-Centric Neutral)
  client: {
    primary: '#1e293b',        // Slate-800
    primaryLight: '#334155',   // Slate-700
    accent: '#f59e0b',         // Amber-500 - warm CTAs
    accentLight: '#fbbf24',    // Amber-400
    background: '#f8fafc',     // Slate-50
    cardBg: '#ffffff',
  },

  // E-commerce Store (Action-Oriented)
  store: {
    primary: '#2563eb',        // Trust blue
    secondary: '#8b5cf6',      // Violet-500 - premium
    accent: '#f97316',         // Orange-500 - urgency
    accentHover: '#ea580c',    // Orange-600
    success: '#10b981',
    priceColor: '#059669',     // Emerald-600
  },

  // Semantic Colors (Status)
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    successBg: '#d1fae5',      // Light backgrounds
    warningBg: '#fef3c7',
    errorBg: '#fee2e2',
    infoBg: '#dbeafe',
  },

  // Neutral Grays (60% of UI)
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
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

// ANIMATIONS
export const animations = {
  duration: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export const designSystem = {
  colors,
  spacing,
  borderRadius,
  shadows,
  buttons,
  dropdowns,
  animations,
};

export default designSystem;
