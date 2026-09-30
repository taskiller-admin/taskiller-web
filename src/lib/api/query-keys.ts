export const queryKeys = {
  me: ['me'] as const,
  account: {
    profile: ['account', 'profile'] as const,
    preferences: ['account', 'preferences'] as const,
    sessions: ['account', 'sessions'] as const,
    export: (id: string) => ['account', 'export', id] as const
  },
  work: {
    all: ['work'] as const,
    list: (filters: Record<string, unknown> = {}) => ['work', 'list', filters] as const,
    chores: ['work', 'chores'] as const,
    inbox: ['work', 'inbox'] as const,
    projects: ['work', 'projects'] as const,
    detail: (id: string) => ['work', 'detail', id] as const,
    children: (id: string) => ['work', 'children', id] as const,
    tree: (id: string) => ['work', 'tree', id] as const,
    nextAction: (id: string) => ['work', 'next-action', id] as const
  },
  focus: {
    all: ['focus'] as const,
    plans: (workItemId: string) => ['focus', 'plans', workItemId] as const,
    plan: (id: string) => ['focus', 'plan', id] as const
  },
  execution: {
    active: ['execution', 'active'] as const,
    detail: (id: string) => ['execution', 'detail', id] as const,
    events: (id: string) => ['execution', 'events', id] as const,
    review: (id: string) => ['execution', 'review', id] as const,
    history: (filters: Record<string, unknown> = {}) => ['execution', 'history', filters] as const
  },
  analytics: {
    all: ['analytics'] as const,
    summary: (from: string, to: string) => ['analytics', 'summary', from, to] as const,
    timeseries: (from: string, to: string, bucket: string) => ['analytics', 'timeseries', from, to, bucket] as const,
    workTypes: (from: string, to: string) => ['analytics', 'work-types', from, to] as const,
    focusPatterns: (from: string, to: string) => ['analytics', 'focus-patterns', from, to] as const,
    workItem: (id: string, from: string, to: string) => ['analytics', 'work-item', id, from, to] as const
  }
};
