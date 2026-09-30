export type ApiProblem = {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
  requestId?: string;
};

export function problemMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (!error || typeof error !== 'object') return fallback;
  const problem = error as ApiProblem;
  return problem.detail || problem.title || fallback;
}
