export const queryKeys = {
  me: ['me'] as const,
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
  execution: {
    active: ['execution', 'active'] as const
  }
};
