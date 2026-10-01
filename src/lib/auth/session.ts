import { writable } from 'svelte/store';
import type { User } from '$lib/api/auth';
import * as authApi from '$lib/api/auth';
import { setAccessToken } from '$lib/api/access-token';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';
export type AuthState = { status: AuthStatus; user: User | null };

const state = writable<AuthState>({ status: 'unknown', user: null });
export const auth = { subscribe: state.subscribe };

export async function bootstrapAuth(
  onProgress?: (progress: number, stage: string) => void
) {
  onProgress?.(12, 'Contacting Taskiller');
  const ok = await authApi.refresh();
  if (!ok) {
    onProgress?.(100, 'Session unavailable');
    state.set({ status: 'anonymous', user: null });
    return false;
  }

  onProgress?.(58, 'Session restored');
  try {
    onProgress?.(72, 'Syncing workspace');
    const user = await authApi.getMe();
    onProgress?.(100, 'Ready');
    state.set({ status: 'authenticated', user });
    return true;
  } catch {
    onProgress?.(100, 'Session unavailable');
    state.set({ status: 'anonymous', user: null });
    return false;
  }
}

export async function login(input: authApi.LoginInput) {
  const response = await authApi.login(input);
  state.set({ status: 'authenticated', user: response.user });
  return response;
}

export async function register(input: authApi.RegisterInput) {
  const response = await authApi.register(input);
  state.set({ status: 'authenticated', user: response.user });
  return response;
}

export function updateAuthenticatedUser(user: User) {
  state.set({ status: 'authenticated', user });
}

export function clearAuth() {
  setAccessToken(null);
  state.set({ status: 'anonymous', user: null });
}

export async function logout() {
  try {
    await authApi.logout();
  } finally {
    clearAuth();
  }
}
