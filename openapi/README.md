# OpenAPI

`taskiller-planning.yaml` is the planning baseline from the product package.
The frontend should develop against the **live backend contract** instead:

```bash
cp .env.example .env
# set PUBLIC_TASKILLER_API_URL
npm run api:update
```

`api:sync` downloads `/openapi.json` from the configured backend into
`openapi/taskiller.json`; `api:generate` then replaces the committed partial
Round-1 types with full generated OpenAPI types.
