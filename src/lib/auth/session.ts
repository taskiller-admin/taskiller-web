import { writable } from 'svelte/store';
import type { User } from '$lib/api/auth';
import * as authApi from '$lib/api/auth';

export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous';
export type AuthState = { status: AuthStatus; user: User | null };

const state = writable<AuthState>({ status: 'unknown', user: null });
export const auth = { subscribe: state.subscribe };

export async function bootstrapAuth() {
  const ok = await authApi.refresh();
  // Round 1 refresh returns the token but not the user through this helper.
  // The login/register flows do populate the user. `getMe` is added in Round 2.
  state.update((current) => ({
    status: ok ? 'authenticated' : 'anonymous',
    user: ok ? current.user : null
  }));
  return ok;
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

export async function logout() {
  await authApi.logout();
  state.set({ status: 'anonymous', user: null });
}
