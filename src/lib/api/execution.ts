import { api } from './client';

export async function getActiveSession() {
  const { data, error } = await api.GET('/api/v1/execution-sessions/active');
  if (error || !data) throw error ?? new Error('Active session returned no data.');
  return data;
}
