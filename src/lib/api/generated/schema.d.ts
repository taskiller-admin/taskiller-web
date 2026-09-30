/**
 * Round-2 contract subset, transcribed from Taskiller backend OpenAPI v1.0.0
 * at backend main 7792c34c49e6a09e7e20380e8b6becf93c863c67.
 * Run `npm run api:update` against the deployed backend to replace this file
 * with the complete openapi-typescript output.
 */
export interface components {
  schemas: {
    UserResponse: {
      id: string;
      email: string;
      displayName: string | null;
      emailVerified: boolean;
      createdAt: string;
      updatedAt: string;
      version: number;
    };
    AuthResponse: {
      accessToken: string;
      tokenType: 'Bearer';
      expiresIn: number;
      user: components['schemas']['UserResponse'];
    };
    LoginRequest: { email: string; password: string; deviceName?: string | null };
    RegisterRequest: {
      email: string;
      password: string;
      displayName?: string | null;
      timezone?: string;
      locale?: string;
    };
    WorkItemKind: 'project' | 'sprint' | 'chore';
    WorkItemStatus: 'draft' | 'ready' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
    CreateWorkItemRequest: {
      kind: components['schemas']['WorkItemKind'];
      name: string;
      status?: components['schemas']['WorkItemStatus'];
      parentId?: string | null;
      workTypeId?: string | null;
      description?: string | null;
      priority?: number | null;
      estimatedEffortSeconds?: number | null;
      plannedStartAt?: string | null;
      deadlineAt?: string | null;
      targetStartDate?: string | null;
      targetEndDate?: string | null;
      characteristicOverrides?: unknown | null;
    };
    UpdateWorkItemRequest: {
      name?: string | null;
      status?: components['schemas']['WorkItemStatus'] | null;
      parentId?: string | null;
      workTypeId?: string | null;
      description?: string | null;
      priority?: number | null;
      estimatedEffortSeconds?: number | null;
      plannedStartAt?: string | null;
      deadlineAt?: string | null;
      targetStartDate?: string | null;
      targetEndDate?: string | null;
      characteristicOverrides?: unknown | null;
    };
    WorkItemResponse: {
      id: string;
      kind: components['schemas']['WorkItemKind'];
      parentId: string | null;
      workTypeId: string | null;
      name: string;
      description: string | null;
      status: components['schemas']['WorkItemStatus'];
      position: number;
      priority: number | null;
      estimatedEffortSeconds: number | null;
      plannedStartAt: string | null;
      deadlineAt: string | null;
      targetStartDate: string | null;
      targetEndDate: string | null;
      completedAt: string | null;
      createdAt: string;
      updatedAt: string;
      deletedAt: string | null;
      version: number;
      characteristicOverrides?: unknown;
      effectiveCharacteristics?: unknown;
    };
    PageMeta: { hasMore: boolean; nextCursor: string | null };
    WorkItemPage: {
      items: components['schemas']['WorkItemResponse'][];
      page: components['schemas']['PageMeta'];
    };
    WorkItemChildrenResponse: { items: components['schemas']['WorkItemResponse'][] };
    WorkItemTreeNode: components['schemas']['WorkItemResponse'] & {
      children: components['schemas']['WorkItemTreeNode'][];
    };
    ReorderWorkItemRequest: { beforeId?: string | null; afterId?: string | null };
    ProjectNextActionResponse: { nextAction: components['schemas']['WorkItemResponse'] | null };
    FocusSegmentKind:
      | 'work'
      | 'break'
      | 'long_break'
      | 'retrieval'
      | 'review'
      | 'planning'
      | 'transition';
    DurationMode: 'fixed' | 'flexible' | 'open';
    FocusPlanSegmentInput: {
      kind: components['schemas']['FocusSegmentKind'];
      durationMode: components['schemas']['DurationMode'];
      targetSeconds?: number | null;
      minSeconds?: number | null;
      maxSeconds?: number | null;
      linkedWorkItemId?: string | null;
      optional?: boolean;
      label?: string | null;
      instructions?: string | null;
    };
    FocusPlanSnapshot: {
      strategy?: string | null;
      segments: components['schemas']['FocusPlanSegmentInput'][];
    };
    ExecutionSessionState: 'running' | 'paused' | 'completed' | 'abandoned';
    ExecutionSession: {
      id: string;
      workItemId: string;
      focusPlanId: string;
      recommendationId: string | null;
      state: components['schemas']['ExecutionSessionState'];
      currentSegmentIndex: number;
      sessionStartedAt: string;
      currentSegmentStartedAt: string | null;
      pausedAt: string | null;
      endedAt: string | null;
      planSnapshot: components['schemas']['FocusPlanSnapshot'];
      recommendationSnapshot?: Record<string, unknown> | null;
      createdAt: string;
      updatedAt: string;
      version: number;
    };
    ActiveExecutionSession: { session: components['schemas']['ExecutionSession'] | null };
    Problem: {
      type: string;
      title: string;
      status: number;
      code: string;
      instance: string;
      detail?: string;
      requestId?: string;
      meta?: Record<string, unknown>;
    };
  };
}

type JsonResponse<T> = { content: { 'application/json': T } };
type ProblemResponse = { content: { 'application/problem+json': components['schemas']['Problem'] } };

export interface paths {
  '/api/v1/auth/login': {
    post: {
      requestBody: { content: { 'application/json': components['schemas']['LoginRequest'] } };
      responses: { 200: JsonResponse<components['schemas']['AuthResponse']>; default: ProblemResponse };
    };
  };
  '/api/v1/auth/register': {
    post: {
      requestBody: { content: { 'application/json': components['schemas']['RegisterRequest'] } };
      responses: { 201: JsonResponse<components['schemas']['AuthResponse']>; default: ProblemResponse };
    };
  };
  '/api/v1/auth/refresh': {
    post: { responses: { 200: JsonResponse<components['schemas']['AuthResponse']>; default: ProblemResponse } };
  };
  '/api/v1/auth/logout': {
    post: { responses: { 204: never; default: ProblemResponse } };
  };
  '/api/v1/me': {
    get: { responses: { 200: JsonResponse<components['schemas']['UserResponse']>; default: ProblemResponse } };
  };
  '/api/v1/work-items': {
    get: {
      parameters: {
        query?: {
          limit?: number;
          cursor?: string | null;
          kind?: components['schemas']['WorkItemKind'] | null;
          status?: components['schemas']['WorkItemStatus'] | null;
          parentId?: string | null;
          includeDeleted?: boolean;
        };
      };
      responses: { 200: JsonResponse<components['schemas']['WorkItemPage']>; default: ProblemResponse };
    };
    post: {
      parameters: { header: { 'Idempotency-Key': string } };
      requestBody: { content: { 'application/json': components['schemas']['CreateWorkItemRequest'] } };
      responses: { 201: JsonResponse<components['schemas']['WorkItemResponse']>; default: ProblemResponse };
    };
  };
  '/api/v1/work-items/{workItemId}': {
    get: {
      parameters: { path: { workItemId: string } };
      responses: { 200: JsonResponse<components['schemas']['WorkItemResponse']>; default: ProblemResponse };
    };
    patch: {
      parameters: { path: { workItemId: string }; header?: { 'If-Match'?: string | null } };
      requestBody: { content: { 'application/json': components['schemas']['UpdateWorkItemRequest'] } };
      responses: { 200: JsonResponse<components['schemas']['WorkItemResponse']>; default: ProblemResponse };
    };
    delete: {
      parameters: { path: { workItemId: string }; header?: { 'If-Match'?: string | null } };
      responses: { 204: never; default: ProblemResponse };
    };
  };
  '/api/v1/work-items/{workItemId}/children': {
    get: {
      parameters: { path: { workItemId: string } };
      responses: { 200: JsonResponse<components['schemas']['WorkItemChildrenResponse']>; default: ProblemResponse };
    };
  };
  '/api/v1/work-items/{workItemId}/tree': {
    get: {
      parameters: { path: { workItemId: string } };
      responses: { 200: JsonResponse<components['schemas']['WorkItemTreeNode']>; default: ProblemResponse };
    };
  };
  '/api/v1/work-items/{workItemId}/reorder': {
    post: {
      parameters: {
        path: { workItemId: string };
        header: { 'Idempotency-Key': string; 'If-Match'?: string | null };
      };
      requestBody: { content: { 'application/json': components['schemas']['ReorderWorkItemRequest'] } };
      responses: { 200: JsonResponse<components['schemas']['WorkItemResponse']>; default: ProblemResponse };
    };
  };
  '/api/v1/projects/{projectId}/next-action': {
    get: {
      parameters: { path: { projectId: string } };
      responses: { 200: JsonResponse<components['schemas']['ProjectNextActionResponse']>; default: ProblemResponse };
    };
  };
  '/api/v1/execution-sessions/active': {
    get: { responses: { 200: JsonResponse<components['schemas']['ActiveExecutionSession']>; default: ProblemResponse } };
  };
}
