import { taskillerJson } from './client';

export type AnalyticsBucket = 'day' | 'week';

export type AnalyticsSummary = {
  from: string;
  to: string;
  activeWorkSeconds: number;
  breakSeconds: number;
  pausedSeconds: number;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  choresCompleted: number;
  medianUninterruptedWorkSeconds?: number | null;
  medianEstimateErrorSeconds?: number | null;
  medianStartDelaySeconds?: number | null;
  requiredSegmentsCompleted: number;
  requiredSegmentsPlanned: number;
  planAdherenceRate?: number | null;
};

export type AnalyticsTimeseriesPoint = {
  bucketStart: string;
  activeWorkSeconds: number;
  breakSeconds: number;
  pausedSeconds: number;
  sessionsCompleted: number;
  choresCompleted: number;
};

export type AnalyticsTimeseries = {
  from: string;
  to: string;
  bucket: AnalyticsBucket;
  timezone: string;
  points: AnalyticsTimeseriesPoint[];
};

export type WorkTypeAnalytics = {
  workTypeId: string | null;
  workTypeSlug: string | null;
  activeWorkSeconds: number;
  sessionCount: number;
  medianUninterruptedWorkSeconds?: number | null;
  medianEstimateErrorSeconds?: number | null;
  completionRate?: number | null;
  medianFocusScore?: number | null;
};

export type WorkItemAnalytics = {
  workItemId: string;
  activeWorkSeconds: number;
  breakSeconds: number;
  pausedSeconds: number;
  sessionCount: number;
  estimateErrorSeconds?: number | null;
  requiredSegmentsCompleted: number;
  requiredSegmentsPlanned: number;
  planAdherenceRate?: number | null;
  firstStartedAt: string | null;
  completedAt: string | null;
};

export type FocusPatternItem = {
  workTypeId: string | null;
  workTypeSlug: string;
  sampleSize: number;
  medianUninterruptedWorkSeconds?: number | null;
  p25UninterruptedWorkSeconds?: number | null;
  p75UninterruptedWorkSeconds?: number | null;
  medianFocusScore?: number | null;
  recommendationPersonalizationEligible: boolean;
};

export type TimeOfDayPatternItem = {
  hourStart: number;
  activeWorkSeconds: number;
  sessionCount: number;
  medianFocusScore?: number | null;
};

export type FocusPatterns = {
  from: string;
  to: string;
  timezone: string;
  items: FocusPatternItem[];
  timeOfDay: TimeOfDayPatternItem[];
};

function analyticsQuery(from: string, to: string, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({ from, to, ...extra });
  return params.toString();
}

export function analyticsRange(days: number, anchorIso = new Date().toISOString()) {
  const to = new Date(anchorIso);
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export async function getAnalyticsSummary(from: string, to: string) {
  return (await taskillerJson<AnalyticsSummary>(`/api/v1/analytics/summary?${analyticsQuery(from, to)}`)).data;
}

export async function getAnalyticsTimeseries(from: string, to: string, bucket: AnalyticsBucket) {
  return (
    await taskillerJson<AnalyticsTimeseries>(
      `/api/v1/analytics/timeseries?${analyticsQuery(from, to, { bucket })}`
    )
  ).data;
}

export async function getWorkTypeAnalytics(from: string, to: string) {
  return (
    await taskillerJson<{ items: WorkTypeAnalytics[] }>(
      `/api/v1/analytics/work-types?${analyticsQuery(from, to)}`
    )
  ).data;
}

export async function getWorkItemAnalytics(id: string, from: string, to: string) {
  return (
    await taskillerJson<WorkItemAnalytics>(
      `/api/v1/analytics/work-items/${encodeURIComponent(id)}?${analyticsQuery(from, to)}`
    )
  ).data;
}

export async function getFocusPatterns(from: string, to: string) {
  return (
    await taskillerJson<FocusPatterns>(
      `/api/v1/analytics/focus-patterns?${analyticsQuery(from, to)}`
    )
  ).data;
}
