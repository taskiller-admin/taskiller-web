export const palettes = [
  { name: 'Ink', background: '#e9eef7', ink: '#243d64', accent: '#ed8b78', soft: '#aebed7' },
  { name: 'Coral', background: '#faeae3', ink: '#34486b', accent: '#cf6857', soft: '#e8b4a1' },
  { name: 'Dusk', background: '#eceaf4', ink: '#45466b', accent: '#de8d87', soft: '#b9b5d4' },
  { name: 'Tide', background: '#e7efee', ink: '#2e535e', accent: '#e58d77', soft: '#a7c5c3' }
] as const;

export const variants = ['Orbit', 'Mosaic', 'Arc'] as const;

export interface AvatarPreference {
  revision: number;
  palette: number;
  variant: number;
}

// Integer operations give identical geometry during SSR and in every browser.
export function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

export function defaultPreference(seed: string): AvatarPreference {
  const hash = hashSeed(seed);
  return { revision: 0, palette: hash % palettes.length, variant: (hash >>> 8) % variants.length };
}

export function generateAvatar(seed: string, preference = defaultPreference(seed)) {
  const hash = hashSeed(`${seed}:${preference.revision}`);
  return {
    palette: palettes[preference.palette] ?? palettes[0],
    variant: preference.variant,
    rotation: (hash % 12) * 30,
    offset: 4 + ((hash >>> 8) % 9),
    signature: `${hash.toString(16)}-${preference.palette}-${preference.variant}`
  };
}
