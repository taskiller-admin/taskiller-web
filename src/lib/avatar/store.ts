import { writable } from 'svelte/store';
import { defaultPreference, palettes, variants, type AvatarPreference } from './generator';

interface AvatarState {
  preference: AvatarPreference;
  saved: boolean;
}

const state = writable<Record<string, AvatarState>>({});
export const avatarPreferences = { subscribe: state.subscribe };
export const avatarStorageKey = (seed: string) => `taskiller:avatar:v1:${encodeURIComponent(seed)}`;

function parsePreference(raw: string | null): AvatarPreference | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    if (!Number.isSafeInteger(value.revision) || value.revision < 0 ||
        !Number.isInteger(value.palette) || value.palette < 0 || value.palette >= palettes.length ||
        !Number.isInteger(value.variant) || value.variant < 0 || value.variant >= variants.length) return null;
    return { revision: value.revision, palette: value.palette, variant: value.variant };
  } catch {
    return null;
  }
}

// Called only after mount: SSR always renders the ID-derived default and never
// retains a user's preferences in a shared server-side store.
export function observeAvatar(seed: string) {
  if (typeof window === 'undefined') return () => {};
  const key = avatarStorageKey(seed);
  const read = () => {
    try {
      const preference = parsePreference(window.localStorage.getItem(key));
      state.update(current => ({ ...current, [seed]: { preference: preference ?? defaultPreference(seed), saved: true } }));
    } catch {
      state.update(current => ({ ...current, [seed]: { preference: defaultPreference(seed), saved: false } }));
    }
  };
  // Don't overwrite an in-memory choice when storage is unavailable and a new
  // instance mounts. Cross-tab changes still explicitly refresh the preference.
  let initialized = false;
  const unsubscribe = state.subscribe(current => { initialized = !!current[seed]; });
  unsubscribe();
  if (!initialized) read();
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) read();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export function saveAvatar(seed: string, preference: AvatarPreference) {
  if (typeof window === 'undefined') return;
  let saved = false;
  try {
    window.localStorage.setItem(avatarStorageKey(seed), JSON.stringify(preference));
    saved = true;
  } catch { /* Keep the current browser session usable if storage is blocked. */ }
  state.update(current => ({ ...current, [seed]: { preference, saved } }));
}
