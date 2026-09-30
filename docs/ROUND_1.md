# Round 1 — Frontend foundation

## Architectural invariants

1. Components do not invent backend state-machine rules.
2. Server state is cached through TanStack Query; local UI state remains local.
3. Access tokens live in memory. Refresh tokens remain HttpOnly backend cookies.
4. Every retryable mutation sends a client-generated Idempotency-Key.
5. Session timers are views over server timestamps, never authoritative client clocks.
6. The live backend OpenAPI document is the contract source of truth.
7. Strike Orange is reserved for identity, current progress and primary actions.
8. Timer expiry never marks work complete automatically.

## Round map

- R1: foundation/auth/Today/API shell — this package
- R2: work hierarchy and editing
- R3: recommendation + Plan & Start
- R4: active execution controls/review/cross-device sync
- R5: analytics/history
- R6: settings/devices/privacy/export/deletion
- R7: PWA/offline resilience/accessibility/performance
- R8: production release hardening and E2E suite
