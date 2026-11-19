import { adminRequest } from './client';
import type { Overview } from './contract';

const day = 86_400_000;
export const trendMetrics = [
  { key: 'completedExecutionSessions', label: 'Completed sessions' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'accountsWithExecutionActivity', label: 'Active accounts' }
] as const;
export type TrendMetric = (typeof trendMetrics)[number]['key'];

export interface ActivityBucket {
  start: string;
  end: string;
  counts: Partial<Record<TrendMetric, number>>;
}

export async function loadActivityBuckets(start: string, end: string, signal: AbortSignal): Promise<ActivityBucket[]> {
  const first = Date.parse(start);
  const last = Date.parse(end);
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) throw new Error('Invalid overview window');

  const days = Math.round((last - first) / day);
  const count = days <= 7 ? 7 : 6;
  const width = (last - first) / count;
  const windows = Array.from({ length: count }, (_, index) => ({
    start: new Date(Math.round(first + index * width)).toISOString(),
    end: new Date(index === count - 1 ? last : Math.round(first + (index + 1) * width)).toISOString()
  }));
  const buckets: ActivityBucket[] = [];
  // Keep concurrency low on the shared production API.
  for (let index = 0; index < windows.length; index += 2) {
    signal.throwIfAborted();
    const group = await Promise.all(windows.slice(index, index + 2).map(async window => {
      const params = new URLSearchParams(window);
      const { data } = await adminRequest<Overview>('overview?' + params, { signal });
      const counts: ActivityBucket['counts'] = {};
      for (const { key } of trendMetrics) {
        const value = data?.[key];
        if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) counts[key] = value;
      }
      return { ...window, counts };
    }));
    buckets.push(...group);
  }
  return buckets;
}

export function periodLabel(value: string) {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(value));
}
