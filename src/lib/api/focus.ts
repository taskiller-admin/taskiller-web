import type { components } from './generated/schema';
import { api } from './client';

export type RecommendationStrategy = components['schemas']['RecommendationStrategy'];
export type FocusPlanRecommendation = components['schemas']['FocusPlanRecommendation'];
export type FocusPlan = components['schemas']['FocusPlan'];
export type FocusPlanSegmentInput = components['schemas']['FocusPlanSegmentInput'];
export type CreateFocusPlanInput = components['schemas']['CreateFocusPlanRequest'];
export type UpdateFocusPlanInput = components['schemas']['UpdateFocusPlanRequest'];

export class FocusPlanConflictError extends Error {
  constructor(message = 'This Focus Plan changed on another client.') {
    super(message);
    this.name = 'FocusPlanConflictError';
  }
}

function mutationKey() {
  return crypto.randomUUID();
}

export async function createRecommendation(input: components['schemas']['CreateRecommendationRequest']) {
  const { data, error } = await api.POST('/api/v1/focus-plan-recommendations', {
    params: { header: { 'Idempotency-Key': mutationKey() } },
    body: input
  });
  if (error || !data) throw error ?? new Error('Recommendation returned no data.');
  return data;
}

export async function listFocusPlans(workItemId: string) {
  const { data, error } = await api.GET('/api/v1/focus-plans', {
    params: { query: { limit: 100, workItemId, templateOnly: false } }
  });
  if (error || !data) throw error ?? new Error('Focus Plans returned no data.');
  return data;
}

export async function getFocusPlan(id: string) {
  const { data, error, response } = await api.GET('/api/v1/focus-plans/{focusPlanId}', {
    params: { path: { focusPlanId: id } }
  });
  if (error || !data) throw error ?? new Error('Focus Plan returned no data.');
  return { plan: data, etag: response.headers.get('etag') };
}

export async function createFocusPlan(input: CreateFocusPlanInput) {
  const { data, error, response } = await api.POST('/api/v1/focus-plans', {
    params: { header: { 'Idempotency-Key': mutationKey() } },
    body: input
  });
  if (error || !data) throw error ?? new Error('Create Focus Plan returned no data.');
  return { plan: data, etag: response.headers.get('etag') };
}

export async function updateFocusPlan(id: string, input: UpdateFocusPlanInput, etag?: string | null) {
  const { data, error, response } = await api.PATCH('/api/v1/focus-plans/{focusPlanId}', {
    params: {
      path: { focusPlanId: id },
      header: etag ? { 'If-Match': etag } : undefined
    },
    body: input
  });
  if (response.status === 412) throw new FocusPlanConflictError();
  if (error || !data) throw error ?? new Error('Update Focus Plan returned no data.');
  return { plan: data, etag: response.headers.get('etag') };
}

export function editableSegments(plan: FocusPlan): FocusPlanSegmentInput[] {
  return plan.segments.map(({ id: _id, index: _index, ...segment }) => ({ ...segment }));
}
