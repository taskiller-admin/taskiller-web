# Taskiller Web Round 6 manifest

## New files

- `src/lib/api/account.ts`
- `src/lib/components/settings/ProfileSettings.svelte`
- `src/lib/components/settings/PreferencesSettings.svelte`
- `src/lib/components/settings/SessionsSettings.svelte`
- `src/lib/components/settings/DataPrivacySettings.svelte`
- `src/routes/verify-email/+page.svelte`
- `src/routes/forgot-password/+page.svelte`
- `src/routes/reset-password/+page.svelte`
- `src/routes/account-deletion-scheduled/+page.svelte`
- `docs/ROUND_6.md`

## Expanded files

- `src/lib/auth/session.ts` — explicit user refresh + local auth clearing helpers
- `src/lib/api/query-keys.ts` — profile/preferences/devices/export cache keys
- `src/lib/components/layout/AppShell.svelte` — profile link + unverified-email signal
- `src/routes/(app)/settings/+page.svelte` — complete account/settings workspace
- `src/routes/login/+page.svelte` — password-recovery entry point
- `package.json` — version `0.6.0`
- `README.md`

## Round-6 behavior

Account lifecycle is now inspectable and actionable from the web client:

profile/preferences → email verification → active devices → data export → account deletion

Password recovery is also available outside the authenticated shell.
