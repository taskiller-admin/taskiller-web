import { writable } from 'svelte/store';

const state = writable(true);
export const online = { subscribe: state.subscribe };

let initialized = false;
export function initConnectivity() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  const sync = () => state.set(navigator.onLine);
  sync();
  window.addEventListener('online', sync);
  window.addEventListener('offline', sync);
}
