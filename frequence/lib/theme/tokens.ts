export type GenreKey = 'club' | 'festival' | 'concert';

export type GenreColor = {
  base: string;   // the solid — chips, bar segments, spine
  tint: string;   // thumbnail wash / chip background
  onFill: string; // text sitting on `base`
};

export type ThemeColors = {
  bg: string;
  surface: string;
  text: string;
  textMuted: string;
  divider: string;
  accent: string;
  accent2: string;
  neutral: Record<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  accentRamp: Record<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;
  genre: Record<GenreKey, { base: string; tint: string; text: string}>;
  // Translucent panel over busy content (map legend, floatin overlays)
  panelTranslucent: string;
  // Soft accent-tinted fill/border, e.g an active icon button in dark-only code
  accentSoftBg: string;
  accentSoftBorder: string;
  // Fixed dark backfrop for loading overlays / modals - stays dark in both themes
  scrim: string;
  danger: string;
  headerBand: [string, string, string];
  genrePalette: { base: string; tint: string }[];
}

const neutral = {
  100: '#f3f5fe',
  200: '#e4e7f5',
  300: '#cfd3e5',
  400: '#b2b6ca',
  500: '#9397ab',
  600: '#75798c',
  700: '#595d6c',
  800: '#3f424d',
  900: '#292b31',
} as const;

const accentRamp = {
  100: '#f5f4ff',
  200: '#e7e5fe',
  300: '#d2cefd',
  400: '#b5abfc',
  500: '#968ae0',
  600: '#796cbf',
  700: '#5d5294',
  800: '#423a6A',
  900: '#2b2741',
} as const

export const darkTheme: ThemeColors = {
  bg: '#161826',
  surface: '#232532',
  text: '#e9e9ed',
  textMuted: 'rgba(233, 233, 237, 0.55)',
  divider: 'rgba(233, 233, 237, 0.18)',
  accent: '#9184d9',
  accent2: '#a7a1db',
  neutral,
  accentRamp,
  genre: {
    club: { base: '#e65fb3', tint: '#4b1738', text: '#fccfe7'},
    festival: { base: '#f19700', tint: '#4f2800', text: '#fdd7ac' },
    concert: { base: '#00c0c2', tint: '#003839', text: '#b0ebea' },
  },
  panelTranslucent: 'rgba(29, 32, 45, 0.85)',
  accentSoftBg: 'rgba(151, 131, 249, 0.15)',
  accentSoftBorder: 'rgba(151, 131, 249, 0.3)',
  scrim: 'rgba(0, 0, 0, 0.5)',
  danger: '#f87171',
  headerBand: ['#2e2338', '#1e2530', '#161826'],
  genrePalette: [
    { base: '#e65fb3', tint: '#4b1738' },
    { base: '#f19700', tint: '#4f2800' },
    { base: '#00c0c2', tint: '#003839' },
    { base: '#9184d9', tint: '#2b2741' },
    { base: '#6fbf5e', tint: '#1b3317' },
    { base: '#e2585c', tint: '#4a1a1c' },
  ],
};

export const lightTheme: ThemeColors = {
  bg: '#faf8f2',
  surface: '#efeade',
  text: '#2f2e38',
  textMuted: 'rgba(28, 31, 41, 0.55)',
  divider: 'rgba(47, 46, 56, 0.14)',
  accent: '#7a5cd6',
  accent2: '#a7a1db',
  neutral,
  accentRamp,
  genre: {
    club: { base: '#f000ad', tint: '#fbcdef', text: '#fff9fd' },
    festival: { base: '#ff8100', tint: '#ffe6cc', text: '#1f1307' },
    concert: { base: '#00acb0', tint: '#d0eff0', text:'#f5fefe' },
  },
  panelTranslucent: 'rgba(248, 245, 233, 0.88)',
  accentSoftBg: 'rgba(126, 75, 255, 0.15)',
  accentSoftBorder: 'rgba(126, 75, 255, 0.3)',
  scrim: 'rgba(0, 0, 0, 0.5)',
  danger: '#f87171',
  headerBand: ['#f3ddea', '#eef0ee', '#faf8f2'],
  genrePalette: [
    { base: '#f000ad', tint: '#fbcdef' },
    { base: '#ff8100', tint: '#ffe6cc' },
    { base: '#00acb0', tint: '#d0eff0' },
    { base: '#7a5cd6', tint: '#e7e1f8' },
    { base: '#4a8e38', tint: '#dcefd7' },
    { base: '#d63b40', tint: '#fadedf' },
  ],
};

export const muted = (colors: ThemeColors, alpha: number = 0.55) => 
  colors.text === '#e9e9ed'
    ? `rgba(233, 233, 237, ${alpha})`
    : `rgba(47, 46,56,${alpha})`;