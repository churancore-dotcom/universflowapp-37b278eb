import { useEffect, useState } from 'react';

export type LockScreenThemeId =
  | 'classic'  // free
  | 'fluid'    // Apple Music morphing metaballs
  | 'canvas'   // Spotify Canvas full-bleed cinematic cover
  | 'galaxy'   // depth particles, parallax nebula
  | 'vinyl'    // photoreal vinyl, tonearm, grooves
  | 'stage';   // synthwave neon stage

export interface LockScreenTheme {
  id: LockScreenThemeId;
  label: string;
  description: string;
  premium: boolean;
  /** Background CSS for the selector thumbnail */
  preview: string;
  /** Tiny tag rendered on top of the preview to hint at the artwork style */
  badge: string;
}

export const LOCK_SCREEN_THEMES: LockScreenTheme[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'Clean square cover with a soft sheen',
    premium: false,
    preview: 'linear-gradient(135deg, #1f1f25 0%, #3a3a45 100%)',
    badge: 'Free',
  },
  {
    id: 'fluid',
    label: 'Fluid',
    description: 'Morphing liquid metaballs reacting to the beat',
    premium: true,
    preview:
      'radial-gradient(circle at 30% 30%, #ff2d55 0%, transparent 55%), radial-gradient(circle at 75% 70%, #5e5ce6 0%, transparent 55%), radial-gradient(circle at 50% 50%, #ff9500 0%, transparent 60%), #06030f',
    badge: 'Apple-style fluid',
  },
  {
    id: 'canvas',
    label: 'Canvas',
    description: 'Full-bleed cinematic cover, parallax & Ken Burns',
    premium: true,
    preview:
      'linear-gradient(160deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.85) 100%), radial-gradient(circle at 30% 30%, #4a1a5a, #06030f 70%)',
    badge: 'Cinematic',
  },
  {
    id: 'galaxy',
    label: 'Galaxy',
    description: 'Depth particles, parallax stars, audio-reactive nebula',
    premium: true,
    preview:
      'radial-gradient(ellipse at 30% 30%, #2a2563 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, #5b2a8c 0%, transparent 55%), #04020c',
    badge: 'Particles',
  },
  {
    id: 'vinyl',
    label: 'Vinyl Pro',
    description: 'Photoreal spinning record with tonearm & grooves',
    premium: true,
    preview:
      'radial-gradient(circle at 50% 50%, #1a1a1a 30%, #000 75%), conic-gradient(from 0deg, #1f1f1f, #0a0a0a, #1f1f1f)',
    badge: 'Spinning disc',
  },
  {
    id: 'stage',
    label: 'Neon Stage',
    description: 'Synthwave grid, swinging spotlights, fog',
    premium: true,
    preview:
      'linear-gradient(180deg, #1b0633 0%, #4a0e6e 55%, #ff2d8a 100%)',
    badge: 'Synthwave',
  },
];

const STORAGE_KEY = 'uf_lockscreen_theme';

// Legacy ids -> new ids
const LEGACY_MAP: Record<string, LockScreenThemeId> = {
  album: 'classic',
  aurora: 'fluid',
  liquid: 'fluid',
  waves: 'fluid',
  pulse: 'fluid',
  prism: 'canvas',
  starfield: 'galaxy',
  orbit: 'galaxy',
  neon: 'stage',
};

export const getStoredLockScreenTheme = (): LockScreenThemeId => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'classic';
    if (LOCK_SCREEN_THEMES.some(t => t.id === raw)) return raw as LockScreenThemeId;
    if (LEGACY_MAP[raw]) return LEGACY_MAP[raw];
  } catch { /* ignore */ }
  return 'classic';
};

export const setStoredLockScreenTheme = (id: LockScreenThemeId) => {
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent('uf:lockscreen-theme', { detail: { id } }));
};

export const useLockScreenTheme = (isPremium: boolean): LockScreenThemeId => {
  const [theme, setTheme] = useState<LockScreenThemeId>(getStoredLockScreenTheme);

  useEffect(() => {
    const handler = (e: Event) => setTheme((e as CustomEvent).detail.id);
    window.addEventListener('uf:lockscreen-theme', handler);
    return () => window.removeEventListener('uf:lockscreen-theme', handler);
  }, []);

  // Non-premium users always fall back to the free classic theme.
  if (!isPremium) return 'classic';
  return theme;
};
