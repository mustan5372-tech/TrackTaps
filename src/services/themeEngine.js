/**
 * Theme Engine for TrackTaps
 * Manages CSS variable injection for premium themes
 */

export const THEMES = {
  default: {
    '--bg-deep': '#080512',
    '--bg-primary': '#0e091b',
    '--bg-secondary': '#161026',
    '--surface': 'rgba(25, 18, 44, 0.35)',
    '--surface-glass': 'rgba(255, 255, 255, 0.08)',
    '--surface-bright': 'rgba(255, 255, 255, 0.14)',
    '--primary': '#8b5cf6',
    '--primary-light': '#a78bfa',
    '--primary-glow': 'rgba(139, 92, 246, 0.35)',
    '--accent': '#d946ef',
    '--text-main': '#f8fafc',
    '--text-dim': '#c4b5fd',
    '--text-muted': '#a78bfa',
    '--border': 'rgba(255, 255, 255, 0.16)',
    '--border-bright': 'rgba(255, 255, 255, 0.30)',
    '--shadow-premium': '0 20px 40px rgba(50, 30, 100, 0.25), 0 0 30px rgba(139, 92, 246, 0.15)',
    '--bg-glow-1': 'rgba(168, 85, 247, 0.22)',
    '--bg-glow-2': 'rgba(139, 92, 246, 0.26)',
    '--bg-glow-3': 'rgba(196, 181, 253, 0.18)',
    '--bg-glow-4': 'rgba(236, 72, 153, 0.10)'
  },
  light: {
    '--bg-deep': '#f4eeff',
    '--bg-primary': '#fcfaff',
    '--bg-secondary': '#ece4ff',
    '--surface': 'rgba(255, 255, 255, 0.45)',
    '--surface-glass': 'rgba(255, 255, 255, 0.65)',
    '--surface-bright': 'rgba(255, 255, 255, 0.85)',
    '--primary': '#7c3aed',
    '--primary-light': '#8b5cf6',
    '--primary-glow': 'rgba(124, 58, 237, 0.15)',
    '--accent': '#db2777',
    '--text-main': '#120b30',
    '--text-dim': '#6366f1',
    '--text-muted': '#8b5cf6',
    '--border': 'rgba(139, 92, 246, 0.18)',
    '--border-bright': 'rgba(139, 92, 246, 0.35)',
    '--shadow-premium': '0 20px 40px rgba(139, 92, 246, 0.10), 0 0 30px rgba(124, 58, 237, 0.08)',
    '--bg-glow-1': 'rgba(196, 181, 253, 0.50)',
    '--bg-glow-2': 'rgba(217, 70, 239, 0.30)',
    '--bg-glow-3': 'rgba(167, 139, 250, 0.40)',
    '--bg-glow-4': 'rgba(14, 165, 233, 0.22)'
  },
  lavender_glass: {
    '--bg-deep': '#090412',
    '--bg-primary': '#0f0721',
    '--bg-secondary': '#170b30',
    '--surface': 'rgba(23, 11, 48, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.05)',
    '--surface-bright': 'rgba(255, 255, 255, 0.12)',
    '--primary': '#b794f4',
    '--primary-light': '#c084fc',
    '--primary-glow': 'rgba(183, 148, 244, 0.25)',
    '--accent': '#f472b6',
    '--text-main': '#f3e8ff',
    '--text-dim': '#d8b4fe',
    '--text-muted': '#a78bfa',
    '--border': 'rgba(255, 255, 255, 0.10)',
    '--border-bright': 'rgba(255, 255, 255, 0.22)',
    '--shadow-premium': '0 20px 45px rgba(9, 4, 18, 0.60), 0 0 30px rgba(183, 148, 244, 0.12)',
    '--bg-glow-1': 'rgba(183, 148, 244, 0.25)',
    '--bg-glow-2': 'rgba(244, 114, 182, 0.15)',
    '--bg-glow-3': 'rgba(139, 92, 246, 0.20)',
    '--bg-glow-4': 'rgba(15, 23, 42, 0.8)'
  },
  midnight_graphite: {
    '--bg-deep': '#090d16',
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--surface': 'rgba(15, 23, 42, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.05)',
    '--surface-bright': 'rgba(255, 255, 255, 0.10)',
    '--primary': '#38bdf8',
    '--primary-light': '#7dd3fc',
    '--primary-glow': 'rgba(56, 189, 248, 0.30)',
    '--accent': '#06b6d4',
    '--text-main': '#f8fafc',
    '--text-dim': '#cbd5e1',
    '--text-muted': '#94a3b8',
    '--border': 'rgba(255, 255, 255, 0.10)',
    '--border-bright': 'rgba(255, 255, 255, 0.20)',
    '--shadow-premium': '0 20px 45px rgba(15, 23, 42, 0.50), 0 0 30px rgba(56, 189, 248, 0.10)',
    '--bg-glow-1': 'rgba(15, 23, 42, 0.80)',
    '--bg-glow-2': 'rgba(56, 189, 248, 0.12)',
    '--bg-glow-3': 'rgba(100, 116, 139, 0.15)',
    '--bg-glow-4': 'rgba(6, 182, 212, 0.08)'
  },
  arctic_frost: {
    '--bg-deep': '#010b12',
    '--bg-primary': '#031724',
    '--bg-secondary': '#062538',
    '--surface': 'rgba(3, 23, 36, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.04)',
    '--surface-bright': 'rgba(255, 255, 255, 0.10)',
    '--primary': '#34d399',
    '--primary-light': '#6ee7b7',
    '--primary-glow': 'rgba(52, 211, 153, 0.20)',
    '--accent': '#38bdf8',
    '--text-main': '#e0f2fe',
    '--text-dim': '#a7f3d0',
    '--text-muted': '#34d399',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--border-bright': 'rgba(255, 255, 255, 0.18)',
    '--shadow-premium': '0 20px 45px rgba(1, 11, 18, 0.70), 0 0 30px rgba(52, 211, 153, 0.10)',
    '--bg-glow-1': 'rgba(52, 211, 153, 0.25)',
    '--bg-glow-2': 'rgba(56, 189, 248, 0.15)',
    '--bg-glow-3': 'rgba(15, 23, 42, 0.8)',
    '--bg-glow-4': 'rgba(4, 13, 26, 0.9)'
  },
  ocean_breeze: {
    '--bg-deep': '#010512',
    '--bg-primary': '#030f28',
    '--bg-secondary': '#05193c',
    '--surface': 'rgba(3, 15, 40, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.05)',
    '--surface-bright': 'rgba(255, 255, 255, 0.12)',
    '--primary': '#3b82f6',
    '--primary-light': '#60a5fa',
    '--primary-glow': 'rgba(59, 130, 246, 0.25)',
    '--accent': '#06b6d4',
    '--text-main': '#eff6ff',
    '--text-dim': '#bfdbfe',
    '--text-muted': '#93c5fd',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--border-bright': 'rgba(255, 255, 255, 0.20)',
    '--shadow-premium': '0 20px 45px rgba(1, 5, 18, 0.65), 0 0 30px rgba(59, 130, 246, 0.15)',
    '--bg-glow-1': 'rgba(59, 130, 246, 0.25)',
    '--bg-glow-2': 'rgba(6, 182, 212, 0.15)',
    '--bg-glow-3': 'rgba(30, 41, 59, 0.5)',
    '--bg-glow-4': 'rgba(3, 7, 18, 0.9)'
  },
  forest_sage: {
    '--bg-deep': '#010a07',
    '--bg-primary': '#021a12',
    '--bg-secondary': '#042a1d',
    '--surface': 'rgba(2, 26, 18, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.04)',
    '--surface-bright': 'rgba(255, 255, 255, 0.10)',
    '--primary': '#10b981',
    '--primary-light': '#34d399',
    '--primary-glow': 'rgba(16, 185, 129, 0.20)',
    '--accent': '#f59e0b',
    '--text-main': '#ecfdf5',
    '--text-dim': '#a7f3d0',
    '--text-muted': '#059669',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--border-bright': 'rgba(255, 255, 255, 0.18)',
    '--shadow-premium': '0 20px 45px rgba(1, 10, 7, 0.65), 0 0 30px rgba(16, 185, 129, 0.12)',
    '--bg-glow-1': 'rgba(16, 185, 129, 0.25)',
    '--bg-glow-2': 'rgba(245, 158, 11, 0.15)',
    '--bg-glow-3': 'rgba(4, 13, 10, 0.8)',
    '--bg-glow-4': 'rgba(6, 78, 59, 0.1)'
  },
  sunset_amber: {
    '--bg-deep': '#0d0501',
    '--bg-primary': '#1b0a03',
    '--bg-secondary': '#2b1005',
    '--surface': 'rgba(27, 10, 3, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.05)',
    '--surface-bright': 'rgba(255, 255, 255, 0.12)',
    '--primary': '#f97316',
    '--primary-light': '#fb923c',
    '--primary-glow': 'rgba(249, 115, 22, 0.25)',
    '--accent': '#eab308',
    '--text-main': '#fff7ed',
    '--text-dim': '#ffedd5',
    '--text-muted': '#f97316',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--border-bright': 'rgba(255, 255, 255, 0.20)',
    '--shadow-premium': '0 20px 45px rgba(13, 5, 1, 0.70), 0 0 30px rgba(249, 115, 22, 0.15)',
    '--bg-glow-1': 'rgba(249, 115, 22, 0.25)',
    '--bg-glow-2': 'rgba(234, 179, 8, 0.15)',
    '--bg-glow-3': 'rgba(12, 6, 2, 0.8)',
    '--bg-glow-4': 'rgba(120, 53, 4, 0.1)'
  },
  rose_quartz: {
    '--bg-deep': '#0d0212',
    '--bg-primary': '#1c0526',
    '--bg-secondary': '#2d093b',
    '--surface': 'rgba(28, 5, 38, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.05)',
    '--surface-bright': 'rgba(255, 255, 255, 0.12)',
    '--primary': '#ec4899',
    '--primary-light': '#f472b6',
    '--primary-glow': 'rgba(236, 72, 153, 0.30)',
    '--accent': '#a855f7',
    '--text-main': '#fdf2f8',
    '--text-dim': '#fbcfe8',
    '--text-muted': '#db2777',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--border-bright': 'rgba(255, 255, 255, 0.20)',
    '--shadow-premium': '0 20px 45px rgba(13, 2, 18, 0.70), 0 0 30px rgba(236, 72, 153, 0.18)',
    '--bg-glow-1': 'rgba(236, 72, 153, 0.30)',
    '--bg-glow-2': 'rgba(168, 85, 247, 0.20)',
    '--bg-glow-3': 'rgba(8, 4, 10, 0.9)',
    '--bg-glow-4': 'rgba(255, 255, 255, 0.02)'
  },
  royal_indigo: {
    '--bg-deep': '#06021c',
    '--bg-primary': '#0e063a',
    '--bg-secondary': '#160a5c',
    '--surface': 'rgba(14, 6, 58, 0.40)',
    '--surface-glass': 'rgba(255, 255, 255, 0.06)',
    '--surface-bright': 'rgba(255, 255, 255, 0.12)',
    '--primary': '#4f46e5',
    '--primary-light': '#818cf8',
    '--primary-glow': 'rgba(79, 70, 229, 0.35)',
    '--accent': '#8b5cf6',
    '--text-main': '#f8fafc',
    '--text-dim': '#c7d2fe',
    '--text-muted': '#818cf8',
    '--border': 'rgba(255, 255, 255, 0.12)',
    '--border-bright': 'rgba(255, 255, 255, 0.25)',
    '--shadow-premium': '0 20px 40px rgba(6, 2, 28, 0.50), 0 0 30px rgba(79, 70, 229, 0.20)',
    '--bg-glow-1': 'rgba(99, 102, 241, 0.25)',
    '--bg-glow-2': 'rgba(139, 92, 246, 0.25)',
    '--bg-glow-3': 'rgba(165, 180, 252, 0.15)',
    '--bg-glow-4': 'rgba(236, 72, 153, 0.08)'
  },
  monochrome_pro: {
    '--bg-deep': '#050505',
    '--bg-primary': '#0c0c0c',
    '--bg-secondary': '#171717',
    '--surface': 'rgba(23, 23, 23, 0.60)',
    '--surface-glass': 'rgba(255, 255, 255, 0.04)',
    '--surface-bright': 'rgba(255, 255, 255, 0.08)',
    '--primary': '#f5f5f5',
    '--primary-light': '#ffffff',
    '--primary-glow': 'rgba(255, 255, 255, 0.15)',
    '--accent': '#a3a3a3',
    '--text-main': '#f5f5f5',
    '--text-dim': '#e5e5e5',
    '--text-muted': '#a3a3a3',
    '--border': 'rgba(255, 255, 255, 0.10)',
    '--border-bright': 'rgba(255, 255, 255, 0.18)',
    '--shadow-premium': '0 20px 45px rgba(0, 0, 0, 0.70)',
    '--bg-glow-1': 'rgba(23, 23, 23, 0.90)',
    '--bg-glow-2': 'rgba(64, 64, 64, 0.10)',
    '--bg-glow-3': 'rgba(38, 38, 38, 0.10)',
    '--bg-glow-4': 'rgba(10, 10, 10, 0.80)'
  }
};

export const applyTheme = (themeName) => {
  let targetTheme = themeName;
  if (!THEMES[targetTheme]) {
    targetTheme = 'default';
  }

  const theme = THEMES[targetTheme];
  const root = document.documentElement;

  console.log(`🎨 [ThemeEngine] Applying tokens for: ${targetTheme}`);

  Object.entries(theme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  const lightThemes = ['light'];
  const isLight = lightThemes.includes(targetTheme);

  if (isLight) {
    root.classList.add('light-mode');
    document.body.classList.add('light-mode');
  } else {
    root.classList.remove('light-mode');
    document.body.classList.remove('light-mode');
  }
};

export const applyAppearanceSettings = (settings) => {
  if (!settings) return;
  const root = document.documentElement;

  // 1. Accent Color
  if (settings.accentColor) {
    const accentColorsMap = {
      purple: {
        '--primary': '#8b5cf6',
        '--primary-light': '#a78bfa',
        '--primary-glow': 'rgba(139, 92, 246, 0.25)',
        '--accent': '#d946ef'
      },
      blue: {
        '--primary': '#3b82f6',
        '--primary-light': '#60a5fa',
        '--primary-glow': 'rgba(59, 130, 246, 0.25)',
        '--accent': '#06b6d4'
      },
      lavender: {
        '--primary': '#a78bfa',
        '--primary-light': '#c084fc',
        '--primary-glow': 'rgba(167, 139, 250, 0.25)',
        '--accent': '#ec4899'
      },
      pink: {
        '--primary': '#ec4899',
        '--primary-light': '#f472b6',
        '--primary-glow': 'rgba(236, 72, 153, 0.25)',
        '--accent': '#8b5cf6'
      }
    };
    const colors = accentColorsMap[settings.accentColor];
    if (colors) {
      Object.entries(colors).forEach(([prop, val]) => {
        root.style.setProperty(prop, val);
      });
    }
  }

  // 2. Animation Speed (mutates transition speeds)
  if (settings.animationSpeed) {
    const factorMap = {
      '0.5x': '0.5s',
      '1x': '0.3s',
      '1.5x': '0.15s'
    };
    root.style.setProperty('--transition-speed', factorMap[settings.animationSpeed] || '0.3s');
  }

  // 3. Compact Mode
  if (settings.compactMode !== undefined) {
    if (settings.compactMode) {
      root.classList.add('compact-mode');
      document.body.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
      document.body.classList.remove('compact-mode');
    }
  }

  // 4. Large Typography
  if (settings.largeText !== undefined) {
    if (settings.largeText) {
      root.classList.add('large-text-mode');
      document.body.classList.add('large-text-mode');
    } else {
      root.classList.remove('large-text-mode');
      document.body.classList.remove('large-text-mode');
    }
  }
};
