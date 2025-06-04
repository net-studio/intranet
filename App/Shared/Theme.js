// src/theme/theme.js
export const COLORS = {
    primary: '#FF7E37',      // Orange principal
    secondary: '#2E4057',    // Bleu foncé
    tertiary: '#67C1F5',     // Bleu clair
    background: '#F7F7F7',   // Fond clair
    darkBackground: '#333333', // Fond foncé pour certains éléments
    white: '#FFFFFF',
    black: '#000000',
    gray: '#CCCCCC',
    lightGray: '#E5E5E5',
    darkGray: '#666666',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#FF5252',
    textPrimary: '#333333',
    textSecondary: '#666666',
    shadow: 'rgba(0, 0, 0, 0.1)',
  };
  
  export const SIZES = {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    base: 10,
  };
  
  export const FONTS = {
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700',
    },
    h1: {
      fontFamily: 'System',
      fontWeight: '700',
      fontSize: SIZES.xxxl,
    },
    h2: {
      fontFamily: 'System',
      fontWeight: '700',
      fontSize: SIZES.xxl,
    },
    h3: {
      fontFamily: 'System',
      fontWeight: '700',
      fontSize: SIZES.xl,
    },
    h4: {
      fontFamily: 'System',
      fontWeight: '600',
      fontSize: SIZES.lg,
    },
    body1: {
      fontFamily: 'System',
      fontWeight: '400',
      fontSize: SIZES.md,
    },
    body2: {
      fontFamily: 'System',
      fontWeight: '400',
      fontSize: SIZES.sm,
    },
    caption: {
      fontFamily: 'System',
      fontWeight: '400',
      fontSize: SIZES.xs,
    },
  };
  
  // Styles neumorphiques (comme sur vos maquettes)
  export const NEUMORPHISM = {
    light: {
      shadowColor: COLORS.shadow,
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 8,
      backgroundColor: COLORS.white,
      borderRadius: SIZES.md,
    },
    dark: {
      shadowColor: COLORS.black,
      shadowOffset: { width: 5, height: 5 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
      backgroundColor: COLORS.darkBackground,
      borderRadius: SIZES.md,
    },
  };
  
  export default { COLORS, SIZES, FONTS, NEUMORPHISM };
  