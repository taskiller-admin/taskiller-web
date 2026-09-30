export const queryKeys = {
  work: {
    all: ['work'] as const,
    chores: ['work', 'chores'] as const
  },
  execution: {
    active: ['execution', 'active'] as const
  }
};
