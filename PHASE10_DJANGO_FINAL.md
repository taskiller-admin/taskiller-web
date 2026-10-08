# Phase 10 — Final Django Client Validation

The frontend API contract did not change during the backend migration. For final validation, start the Django backend and run:

```bash
TASKILLER_DJANGO_API_URL=http://127.0.0.1:8000 npm run release:django
```

After this succeeds, the Svelte client is validated against the final Django-only backend.
