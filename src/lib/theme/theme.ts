import { get, writable } from 'svelte/store';

export type ThemeMode = 'system' | 'light' | 'dark';

const mode = writable<ThemeMode>('system');
export const themeMode = { subscribe: mode.subscribe };

let initialized = false;
let media: MediaQueryList | null = null;
let mediaHandler: (() => void) | null = null;

function resolved(modeValue: ThemeMode): 'light' | 'dark' {
  if (modeValue === 'light' || modeValue === 'dark') return modeValue;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function apply(modeValue: ThemeMode, persist = true) {
  if (typeof window === 'undefined') return;
  const value = resolved(modeValue);
  document.documentElement.dataset.theme = value;
  document.documentElement.classList.toggle('dark', value === 'dark');
  document.documentElement.style.colorScheme = value;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = value === 'dark' ? '#090c10' : '#edf2f4';

  if (persist) localStorage.setItem('taskiller-theme', modeValue);
}

function syncSystemListener(modeValue: ThemeMode) {
  if (media && mediaHandler) media.removeEventListener('change', mediaHandler);
  media = null;
  mediaHandler = null;

  if (modeValue !== 'system') return;

  media = window.matchMedia('(prefers-color-scheme: dark)');
  mediaHandler = () => apply('system', false);
  media.addEventListener('change', mediaHandler);
}

export function initTheme() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const stored = localStorage.getItem('taskiller-theme');
  const initial: ThemeMode =
    stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';

  mode.set(initial);
  apply(initial, false);
  syncSystemListener(initial);
}

export function setTheme(value: ThemeMode) {
  mode.set(value);
  apply(value);
  syncSystemListener(value);
}

export function cycleTheme() {
  const current = get(mode);
  const next: ThemeMode = current === 'system' ? 'light' : current === 'light' ? 'dark' : 'system';
  setTheme(next);
}
