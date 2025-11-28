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
        // Studio colors
        'studio': {
          primary: designSystem.colors.studio.primary,
          'primary-light': designSystem.colors.studio.primaryLight,
          'primary-dark': designSystem.colors.studio.primaryDark,
          'primary-lighter': designSystem.colors.studio.primaryLighter,
          'primary-darker': designSystem.colors.studio.primaryDarker,
          secondary: designSystem.colors.studio.secondary,
          accent: designSystem.colors.studio.accent,
          warning: designSystem.colors.studio.warning,
          danger: designSystem.colors.studio.danger,
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
        success: designSystem.colors.semantic.success,
        warning: designSystem.colors.semantic.warning,
        error: designSystem.colors.semantic.error,
        info: designSystem.colors.semantic.info,
      },
      
      spacing: designSystem.spacing,
      borderRadius: designSystem.borderRadius,
      boxShadow: designSystem.shadows,
      
      transitionDuration: {
        fast: designSystem.animations.duration.fast,
        normal: designSystem.animations.duration.normal,
        slow: designSystem.animations.duration.slow,
      },
      
      transitionTimingFunction: {
        'ease-out': designSystem.animations.easing.easeOut,
        'ease-in-out': designSystem.animations.easing.easeInOut,
        'spring': designSystem.animations.easing.spring,
      },
    },
  },
  plugins: [],
}
