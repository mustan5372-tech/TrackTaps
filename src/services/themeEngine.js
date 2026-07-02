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
  }
};

export const applyTheme = (themeName) => {
  // Map standard themes to default/light if user stored custom themes previously
  let targetTheme = themeName;
  if (targetTheme !== 'light') {
    targetTheme = 'default';
  }

  const theme = THEMES[targetTheme];
  const root = document.documentElement;

  console.log(`🎨 [ThemeEngine] Applying tokens for: ${targetTheme}`);

  Object.entries(theme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  if (targetTheme === 'light') {
    root.classList.add('light-mode');
    document.body.classList.add('light-mode');
  } else {
    root.classList.remove('light-mode');
    document.body.classList.remove('light-mode');
  }
};
