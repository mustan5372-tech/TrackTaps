/**
 * Theme Engine for TrackTaps
 * Manages CSS variable injection for premium themes
 */

export const THEMES = {
  default: {
    '--bg-deep': '#020617',
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--surface': 'rgba(30, 41, 59, 0.5)',
    '--surface-glass': 'rgba(15, 23, 42, 0.6)',
    '--surface-bright': 'rgba(255, 255, 255, 0.03)',
    '--primary': '#8b5cf6',
    '--primary-light': '#a78bfa',
    '--primary-glow': 'rgba(139, 92, 246, 0.3)',
    '--accent': '#d946ef',
    '--text-main': '#f8fafc',
    '--text-dim': '#94a3b8',
    '--text-muted': '#64748b',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--border-bright': 'rgba(255, 255, 255, 0.15)',
    '--shadow-premium': '0 0 30px rgba(139, 92, 246, 0.2)'
  },
  light: {
    '--bg-deep': '#f1f5f9',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#f8fafc',
    '--surface': 'rgba(226, 232, 240, 0.5)',
    '--surface-glass': 'rgba(255, 255, 255, 0.8)',
    '--surface-bright': 'rgba(0, 0, 0, 0.02)',
    '--primary': '#7c3aed',
    '--primary-light': '#8b5cf6',
    '--primary-glow': 'rgba(124, 58, 237, 0.1)',
    '--accent': '#db2777',
    '--text-main': '#0f172a',
    '--text-dim': '#475569',
    '--text-muted': '#64748b',
    '--border': 'rgba(0, 0, 0, 0.08)',
    '--border-bright': 'rgba(0, 0, 0, 0.12)',
    '--shadow-premium': '0 10px 30px rgba(124, 58, 237, 0.1)'
  },
  amoled: {
    '--bg-deep': '#000000',
    '--bg-primary': '#000000',
    '--bg-secondary': '#0a0a0a',
    '--surface': 'rgba(20, 20, 20, 0.8)',
    '--surface-glass': 'rgba(10, 10, 10, 0.9)',
    '--surface-bright': 'rgba(255, 255, 255, 0.05)',
    '--primary': '#ffffff',
    '--primary-light': '#f8fafc',
    '--primary-glow': 'rgba(255, 255, 255, 0.1)',
    '--accent': '#ffffff',
    '--text-main': '#ffffff',
    '--text-dim': '#a1a1aa',
    '--text-muted': '#52525b',
    '--border': 'rgba(255, 255, 255, 0.15)',
    '--border-bright': 'rgba(255, 255, 255, 0.25)',
    '--shadow-premium': '0 0 40px rgba(255, 255, 255, 0.1)'
  },
  neon: {
    '--bg-deep': '#09090b',
    '--bg-primary': '#09090b',
    '--bg-secondary': '#18181b',
    '--surface': 'rgba(39, 39, 42, 0.5)',
    '--surface-glass': 'rgba(24, 24, 27, 0.7)',
    '--surface-bright': 'rgba(139, 92, 246, 0.05)',
    '--primary': '#d946ef',
    '--primary-light': '#f472b6',
    '--primary-glow': 'rgba(217, 70, 239, 0.4)',
    '--accent': '#8b5cf6',
    '--text-main': '#fafafa',
    '--text-dim': '#d4d4d8',
    '--text-muted': '#71717a',
    '--border': 'rgba(217, 70, 239, 0.3)',
    '--border-bright': 'rgba(217, 70, 239, 0.5)',
    '--shadow-premium': '0 0 40px rgba(217, 70, 239, 0.2)'
  },
  cyberpunk: {
    '--bg-deep': '#050505',
    '--bg-primary': '#050505',
    '--bg-secondary': '#0f0f0f',
    '--surface': 'rgba(15, 15, 15, 0.9)',
    '--surface-glass': 'rgba(10, 10, 10, 0.95)',
    '--surface-bright': 'rgba(0, 242, 255, 0.05)',
    '--primary': '#00f2ff',
    '--primary-light': '#70f9ff',
    '--primary-glow': 'rgba(0, 242, 255, 0.4)',
    '--accent': '#ffe600',
    '--text-main': '#ffffff',
    '--text-dim': '#00f2ff',
    '--text-muted': '#444444',
    '--border': 'rgba(0, 242, 255, 0.4)',
    '--border-bright': 'rgba(0, 242, 255, 0.6)',
    '--shadow-premium': '0 0 50px rgba(0, 242, 255, 0.2)'
  },
  midnight: {
    '--bg-deep': '#020617',
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--surface': 'rgba(30, 41, 59, 0.5)',
    '--surface-glass': 'rgba(15, 23, 42, 0.7)',
    '--surface-bright': 'rgba(56, 189, 248, 0.05)',
    '--primary': '#38bdf8',
    '--primary-light': '#7dd3fc',
    '--primary-glow': 'rgba(56, 189, 248, 0.3)',
    '--accent': '#818cf8',
    '--text-main': '#f8fafc',
    '--text-dim': '#94a3b8',
    '--text-muted': '#64748b',
    '--border': 'rgba(56, 189, 248, 0.2)',
    '--border-bright': 'rgba(56, 189, 248, 0.4)',
    '--shadow-premium': '0 0 30px rgba(56, 189, 248, 0.15)'
  },
  gold: {
    '--bg-deep': '#0c0a09',
    '--bg-primary': '#0c0a09',
    '--bg-secondary': '#1c1917',
    '--surface': 'rgba(41, 37, 36, 0.5)',
    '--surface-glass': 'rgba(28, 25, 23, 0.8)',
    '--surface-bright': 'rgba(245, 158, 11, 0.05)',
    '--primary': '#f59e0b',
    '--primary-light': '#fbbf24',
    '--primary-glow': 'rgba(245, 158, 11, 0.3)',
    '--accent': '#d97706',
    '--text-main': '#fafaf9',
    '--text-dim': '#d6d3d1',
    '--text-muted': '#78716c',
    '--border': 'rgba(245, 158, 11, 0.3)',
    '--border-bright': 'rgba(245, 158, 11, 0.5)',
    '--shadow-premium': '0 0 30px rgba(245, 158, 11, 0.15)'
  },
  minimal: {
    '--bg-deep': '#ffffff',
    '--bg-primary': '#ffffff',
    '--bg-secondary': '#fafafa',
    '--surface': 'rgba(244, 244, 245, 0.8)',
    '--surface-glass': 'rgba(255, 255, 255, 0.9)',
    '--surface-bright': 'rgba(0, 0, 0, 0.02)',
    '--primary': '#18181b',
    '--primary-light': '#3f3f46',
    '--primary-glow': 'rgba(24, 24, 27, 0.05)',
    '--accent': '#18181b',
    '--text-main': '#18181b',
    '--text-dim': '#52525b',
    '--text-muted': '#a1a1aa',
    '--border': 'rgba(24, 24, 27, 0.1)',
    '--border-bright': 'rgba(24, 24, 27, 0.2)',
    '--shadow-premium': '0 4px 12px rgba(0, 0, 0, 0.05)'
  },
  pod: {
    '--bg-deep': '#020617',
    '--bg-primary': '#0f172a',
    '--bg-secondary': '#1e293b',
    '--surface': 'rgba(79, 70, 229, 0.1)',
    '--surface-glass': 'rgba(15, 23, 42, 0.7)',
    '--surface-bright': 'rgba(99, 102, 241, 0.05)',
    '--primary': '#6366f1',
    '--primary-light': '#818cf8',
    '--primary-glow': 'rgba(99, 102, 241, 0.3)',
    '--accent': '#4f46e5',
    '--text-main': '#f8fafc',
    '--text-dim': '#94a3b8',
    '--text-muted': '#64748b',
    '--border': 'rgba(99, 102, 241, 0.2)',
    '--border-bright': 'rgba(99, 102, 241, 0.4)',
    '--shadow-premium': '0 0 30px rgba(99, 102, 241, 0.15)'
  }
};

export const applyTheme = (themeName) => {
  const theme = THEMES[themeName] || THEMES.default;
  const root = document.documentElement;

  console.log(`🎨 [ThemeEngine] Applying tokens for: ${themeName}`);

  Object.entries(theme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  // Handle dark/light mode for system UI (if needed)
  if (themeName === 'minimal' || themeName === 'light') {
    root.classList.add('light-mode');
  } else {
    root.classList.remove('light-mode');
  }
};
