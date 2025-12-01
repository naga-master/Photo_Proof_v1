import designSystem from './config/designSystem';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary color - SINGLE SOURCE via CSS variable
        'primary': {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          light: 'var(--color-primary-light)',
          lighter: 'var(--color-primary-lighter)',
        },
        
        // Studio colors (references primary)
        'studio': {
          primary: designSystem.colors.studio.primary,
          'primary-hover': designSystem.colors.studio.primaryHover,
          'primary-active': designSystem.colors.studio.primaryActive,
          'primary-light': designSystem.colors.studio.primaryLight,
          'primary-lighter': designSystem.colors.studio.primaryLighter,
          secondary: designSystem.colors.studio.secondary,
          accent: designSystem.colors.studio.accent,
          warning: designSystem.colors.studio.warning,
          danger: designSystem.colors.studio.danger,
        },
        
        // Sidebar colors
        'sidebar': {
          bg: designSystem.colors.sidebar.bg,
          border: designSystem.colors.sidebar.border,
          text: designSystem.colors.sidebar.text,
          'text-muted': designSystem.colors.sidebar.textMuted,
          'text-hover': designSystem.colors.sidebar.textHover,
          'item-hover': designSystem.colors.sidebar.itemHover,
          'item-active': designSystem.colors.sidebar.itemActive,
          'item-active-text': designSystem.colors.sidebar.itemActiveText,
        },
        
        // Client colors
        'client': {
          primary: designSystem.colors.client.primary,
          'primary-light': designSystem.colors.client.primaryLight,
          accent: designSystem.colors.client.accent,
          'accent-light': designSystem.colors.client.accentLight,
          bg: designSystem.colors.client.background,
        },
        
        // Store colors
        'store': {
          primary: designSystem.colors.store.primary,
          secondary: designSystem.colors.store.secondary,
          accent: designSystem.colors.store.accent,
          'accent-hover': designSystem.colors.store.accentHover,
          success: designSystem.colors.store.success,
          price: designSystem.colors.store.priceColor,
        },
        
        // Semantic colors
        'success': designSystem.colors.semantic.success,
        'success-light': designSystem.colors.semantic.successLight,
        'warning': designSystem.colors.semantic.warning,
        'warning-light': designSystem.colors.semantic.warningLight,
        'error': designSystem.colors.semantic.error,
        'error-light': designSystem.colors.semantic.errorLight,
        'info': designSystem.colors.semantic.info,
        'info-light': designSystem.colors.semantic.infoLight,
        
        // Background colors
        'bg': designSystem.colors.background,
        
        // Border colors
        'border': designSystem.colors.border,
        
        // Text colors
        'text': designSystem.colors.text,
      },
      
      // Font families
      fontFamily: {
        sans: designSystem.typography.fonts.sans,
        display: designSystem.typography.fonts.display,
        mono: designSystem.typography.fonts.mono,
      },
      
      spacing: designSystem.spacing,
      borderRadius: designSystem.borderRadius,
      boxShadow: {
        ...designSystem.shadows,
        'card-hover': '0 8px 25px -5px rgb(0 0 0 / 0.1), 0 4px 10px -6px rgb(0 0 0 / 0.05)',
      },
      
      transitionDuration: {
        instant: designSystem.animations.duration.instant,
        fast: designSystem.animations.duration.fast,
        normal: designSystem.animations.duration.normal,
        slow: designSystem.animations.duration.slow,
        slower: designSystem.animations.duration.slower,
      },
      
      transitionTimingFunction: {
        'ease-out': designSystem.animations.easing.easeOut,
        'ease-in-out': designSystem.animations.easing.easeInOut,
        'spring': designSystem.animations.easing.spring,
        'bounce': designSystem.animations.easing.bounce,
      },
      
      // Letter spacing
      letterSpacing: designSystem.typography.letterSpacing,
    },
  },
  plugins: [],
}
