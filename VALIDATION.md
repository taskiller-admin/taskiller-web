# Round 2 validation

## Contract basis

Backend inspected before implementation:

- repository: `kmab5/taskiller-backend`
- branch: `main`
- commit: `7792c34c49e6a09e7e20380e8b6becf93c863c67`
- API version: `1.0.0`

The Round-2 handwritten bootstrap types cover the exact work/auth/active-session endpoints used by the UI. `npm run api:update` replaces them with generated types from the deployed backend.

## Checks completed in the build environment

- `package.json` parses as JSON.
- `components.json` parses as JSON.
- `openapi/taskiller.json` parses as OpenAPI JSON structure.
- `src/lib/api/generated/schema.d.ts` parses with TypeScript.
- TypeScript inside all 26 Svelte `<script>` blocks parses successfully.
- Basic structural Svelte tag-balance checks pass.
- Every relative and `$lib` import resolves to a local source file.
- No generated helper/temporary patch files are included in the frontend project.

## Environment limitation

`npm install` could not complete in the artifact container because external package installation timed out. Therefore this artifact is **not claimed to have passed `svelte-check` or `vite build` inside the container**.

Run these immediately after extraction:

```bash
npm install
npm run check
npm run build
```

If your deployed API is reachable, also run:

```bash
npm run api:update
npm run check
npm run build
```

This is the authoritative compiler validation because it uses the actual dependency graph and full generated backend contract.
