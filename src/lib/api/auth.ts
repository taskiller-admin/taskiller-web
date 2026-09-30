import type { components } from './generated/schema';
import { api, refreshAccessToken } from './client';
import { setAccessToken } from './access-token';

export type User = components['schemas']['UserResponse'];
export type LoginInput = components['schemas']['LoginRequest'];
export type RegisterInput = components['schemas']['RegisterRequest'];

export async function login(input: LoginInput) {
  const { data, error } = await api.POST('/api/v1/auth/login', { body: input });
  if (error || !data) throw error ?? new Error('Login returned no data.');
  setAccessToken(data.accessToken);
  return data;
}

export async function register(input: RegisterInput) {
  const { data, error } = await api.POST('/api/v1/auth/register', { body: input });
  if (error || !data) throw error ?? new Error('Registration returned no data.');
  setAccessToken(data.accessToken);
  return data;
}

export async function refresh() {
  return refreshAccessToken();
}

export async function logout() {
  try {
    await api.POST('/api/v1/auth/logout');
  } finally {
    setAccessToken(null);
  }
}
