import { get, writable } from 'svelte/store';

type InstallPromptEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type InstallState = { available: boolean; installed: boolean; prompt: InstallPromptEvent | null };

const state = writable<InstallState>({ available: false, installed: false, prompt: null });
export const installState = { subscribe: state.subscribe };
let initialized = false;

export function initInstallPrompt() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  state.update((current) => ({ ...current, installed: standalone }));
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    state.set({ available: true, installed: false, prompt: event as InstallPromptEvent });
  });
  window.addEventListener('appinstalled', () => state.set({ available: false, installed: true, prompt: null }));
}

export async function promptInstall() {
  const snapshot = get(state);
  const prompt = snapshot.prompt;
  if (!prompt) return false;

  await prompt.prompt();
  const choice = await prompt.userChoice;
  state.set({ available: false, installed: choice.outcome === 'accepted', prompt: null });
  return choice.outcome === 'accepted';
}
