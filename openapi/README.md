# OpenAPI in the frontend

`taskiller.json` is the committed **frontend-used contract surface**. Earlier rounds intentionally kept this snapshot smaller than the complete backend specification.

The backend remains authoritative.

## Compatibility gate

```bash
npm run api:check
```

The check fetches the configured backend OpenAPI and verifies every committed frontend path, operation, and schema still matches. Backend-only additions are allowed.

CI points this at backend `main`'s committed `openapi/current.json`.

## Full sync

When the backend contract changes, or when you want to replace the reduced snapshot with the complete deployed contract:

```bash
npm run api:update
```

This:

1. fetches `TASKILLER_OPENAPI_URL` when set, otherwise `${PUBLIC_TASKILLER_API_URL}/openapi.json`;
2. replaces `openapi/taskiller.json`;
3. runs `openapi-typescript`;
4. replaces `src/lib/api/generated/schema.d.ts`.

Review both files together and commit them together. Do not hand-edit generated schema output after synchronization.
