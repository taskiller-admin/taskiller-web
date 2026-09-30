import { writable } from 'svelte/store';
import type { User } from '$lib/api/auth';
import * as authApi from '$lib/api/auth';
import { setAccessToken } from '$lib/api/access-token';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';
export type AuthState = { status: AuthStatus; user: User | null };

const state = writable<AuthState>({ status: 'unknown', user: null });
export const auth = { subscribe: state.subscribe };

export async function bootstrapAuth() {
  const ok = await authApi.refresh();
  if (!ok) {
    state.set({ status: 'anonymous', user: null });
    return false;
  }

  try {
    const user = await authApi.getMe();
    state.set({ status: 'authenticated', user });
    return true;
  } catch {
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
