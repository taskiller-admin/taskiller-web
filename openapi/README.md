# OpenAPI in the frontend

`taskiller.json` is a **Round-2 bootstrap subset** matching the work/auth/session endpoints used before code generation is run.

The deployed backend remains authoritative. As soon as the API is reachable, run:

```bash
npm run api:update
```

That command:

1. downloads `${PUBLIC_TASKILLER_API_URL}/openapi.json`;
2. replaces `openapi/taskiller.json`;
3. runs `openapi-typescript`;
4. replaces `src/lib/api/generated/schema.d.ts` with the complete generated contract.

Do not hand-edit generated output after that point. Keep handwritten behavior in `src/lib/api/*`.
