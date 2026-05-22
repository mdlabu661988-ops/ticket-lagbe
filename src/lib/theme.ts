/**
 * Theme & CSS Variable Control Utility
 * Fetches and applies saved CSS & Theme configurations dynamically.
 */

export interface ThemeSettings {
  theme_mode: 'light' | 'dark' | 'custom';
  color_primary: string;
  color_secondary: string;
  color_text: string;
  color_bg: string;
  custom_css: string;
  font_family: string;
  base_font_size: string;
}

export const defaultThemeSettings: ThemeSettings = {
  theme_mode: 'light',
  color_primary: '#2563eb',
  color_secondary: '#475569',
  color_text: '#0f172a',
  color_bg: '#f8fafc',
  custom_css: '/* Add your custom raw CSS here */',
  font_family: 'Inter',
  base_font_size: '16'
};

/**
 * Dynamically applies the theme variables and injects custom raw CSS into the document.
 */
export function applyTheme(settings: Partial<ThemeSettings>) {
  const root = document.documentElement;

  // Decide colors based on mode or custom
  let primary = settings.color_primary || defaultThemeSettings.color_primary;
  let secondary = settings.color_secondary || defaultThemeSettings.color_secondary;
  let text = settings.color_text || defaultThemeSettings.color_text;
  let bg = settings.color_bg || defaultThemeSettings.color_bg;
  const fontFamily = settings.font_family || defaultThemeSettings.font_family;
  const baseFontSize = settings.base_font_size || defaultThemeSettings.base_font_size;

  if (settings.theme_mode === 'dark') {
    primary = '#3b82f6';
    secondary = '#94a3b8';
    text = '#f1f5f9';
    bg = '#0f172a';

    root.style.setProperty('--theme-slate-50', '#0f172a');
    root.style.setProperty('--theme-slate-100', '#1e293b');
    root.style.setProperty('--theme-slate-200', '#334155');
    root.style.setProperty('--theme-slate-300', '#475569');
    root.style.setProperty('--theme-slate-400', '#64748b');
    root.style.setProperty('--theme-slate-500', '#94a3b8');
    root.style.setProperty('--theme-slate-600', '#cbd5e1');
    root.style.setProperty('--theme-slate-800', '#f1f5f9');
    root.style.setProperty('--theme-slate-900', '#f8fafc');

    root.style.setProperty('--theme-blue-50', '#1e293b');
    root.style.setProperty('--theme-blue-100', '#172554');
    root.style.setProperty('--theme-blue-600', '#3b82f6');
    root.style.setProperty('--theme-blue-700', '#60a5fa');
  } else if (settings.theme_mode === 'light') {
    primary = '#2563eb';
    secondary = '#475569';
    text = '#0f172a';
    bg = '#f8fafc';

    root.style.setProperty('--theme-slate-50', '#f8fafc');
    root.style.setProperty('--theme-slate-100', '#f1f5f9');
    root.style.setProperty('--theme-slate-200', '#e2e8f0');
    root.style.setProperty('--theme-slate-300', '#cbd5e1');
    root.style.setProperty('--theme-slate-400', '#94a3b8');
    root.style.setProperty('--theme-slate-500', '#64748b');
    root.style.setProperty('--theme-slate-600', '#475569');
    root.style.setProperty('--theme-slate-800', '#1e293b');
    root.style.setProperty('--theme-slate-900', '#0f172a');

    root.style.setProperty('--theme-blue-50', '#eff6ff');
    root.style.setProperty('--theme-blue-100', '#dbeafe');
    root.style.setProperty('--theme-blue-600', '#2563eb');
    root.style.setProperty('--theme-blue-700', '#1d4ed8');
  } else {
    // Custom theme: dynamically derive shades based on bg and text brightness
    const isBgDark = isDarkHex(bg);
    root.style.setProperty('--theme-slate-50', bg);
    root.style.setProperty('--theme-slate-100', isBgDark ? lightenDrag(bg, 0.08) : darkenDrag(bg, 0.04));
    root.style.setProperty('--theme-slate-200', isBgDark ? lightenDrag(bg, 0.16) : darkenDrag(bg, 0.08));
    root.style.setProperty('--theme-slate-300', isBgDark ? lightenDrag(bg, 0.24) : darkenDrag(bg, 0.15));
    root.style.setProperty('--theme-slate-400', isBgDark ? lightenDrag(bg, 0.35) : darkenDrag(bg, 0.25));
    root.style.setProperty('--theme-slate-500', isBgDark ? darkenDrag(text, 0.35) : lightenDrag(text, 0.35));
    root.style.setProperty('--theme-slate-600', isBgDark ? darkenDrag(text, 0.25) : lightenDrag(text, 0.25));
    root.style.setProperty('--theme-slate-800', isBgDark ? darkenDrag(text, 0.1) : lightenDrag(text, 0.1));
    root.style.setProperty('--theme-slate-900', text);

    root.style.setProperty('--theme-blue-50', isBgDark ? darkenDrag(primary, 0.7) : lightenDrag(primary, 0.7));
    root.style.setProperty('--theme-blue-100', isBgDark ? darkenDrag(primary, 0.5) : lightenDrag(primary, 0.5));
    root.style.setProperty('--theme-blue-600', primary);
    root.style.setProperty('--theme-blue-700', getHoverColor(primary));
  }

  // 1. Inject custom variables into Root
  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-secondary', secondary);
  root.style.setProperty('--theme-text', text);
  root.style.setProperty('--theme-bg', bg);
  root.style.setProperty('--font-family', fontFamily);
  root.style.setProperty('--base-font-size', `${baseFontSize}px`);

  // 2. Map standard Tailwind CSS design variables (V4 CSS Variables map beautifully!)
  root.style.setProperty('--color-blue-600', primary);
  root.style.setProperty('--color-blue-700', getHoverColor(primary));
  
  // Apply fonts
  root.style.setProperty('--font-sans', `"${fontFamily}", "Noto Sans Bengali", ui-sans-serif, system-ui, sans-serif`);
  
  // Set background and text colors directly to standard body tags
  document.body.style.fontFamily = `var(--font-sans)`;
  document.body.style.fontSize = `${baseFontSize}px`;

  // Apply to general slate-900 / slate-50 variables for standard theme mapping (without break/reset)
  if (settings.theme_mode === 'dark' || settings.theme_mode === 'custom') {
    root.style.setProperty('--color-slate-900', text);
    root.style.setProperty('--color-slate-50', bg);
  } else {
    // defaults
    root.style.setProperty('--color-slate-900', '#0f172a');
    root.style.setProperty('--color-slate-50', '#f8fafc');
  }

  // 3. Inject raw Custom CSS Box styles
  let styleTag = document.getElementById('custom-theme-styles-block');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'custom-theme-styles-block';
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = settings.custom_css || '';
}

/**
 * Fetch theme from API and apply globally
 */
export async function fetchAndApplyTheme() {
  try {
    const response = await fetch('/api/settings/theme');
    if (response.ok) {
      const themeData = await response.json();
      applyTheme(themeData);
      return themeData;
    }
  } catch (error) {
    console.error('Error fetching/applying theme settings:', error);
  }
  return null;
}

/**
 * Simple helper to generate dark/light hover variations of a hex color code
 */
function getHoverColor(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) {
    return hex;
  }
  // Try to darken/lighten slightly
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const factor = 0.85; // 15% darker for hover
  const rDark = Math.max(0, Math.floor(r * factor));
  const gDark = Math.max(0, Math.floor(g * factor));
  const bDark = Math.max(0, Math.floor(b * factor));
  
  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(rDark)}${toHex(gDark)}${toHex(bDark)}`;
}

function isDarkHex(hex: string): boolean {
  if (!hex.startsWith('#') || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma < 128;
}

function lightenDrag(hex: string, amount: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, Math.floor(r + (255 - r) * amount));
  g = Math.min(255, Math.floor(g + (255 - g) * amount));
  b = Math.min(255, Math.floor(b + (255 - b) * amount));

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function darkenDrag(hex: string, amount: number): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

