# Phase 9 Real-Django E2E

Frontend source: `c49bedaf7dc33dc13403d298be092b02562def09`

Run against a disposable Django backend:

```bash
TASKILLER_DJANGO_API_URL=http://127.0.0.1:8000 npm run test:e2e:django
```

The backend must allow `http://127.0.0.1:4173` in `TASKILLER_CORS_ORIGINS`.
