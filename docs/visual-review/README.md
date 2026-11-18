# Momentum visual review

Screenshots use synthetic API fixtures, never a production account. The fixture data is for design review only; it is not shipped in the product.

`checks.json` records 76 cases: 19 routes × two viewports × two themes. The confirmed pass has no page exceptions, document horizontal overflow, or serious/critical Axe findings. Screenshots cover landing, authentication, Today, Projects, planning, sessions, Analytics, and Settings. Full browser tests additionally exercise dialogs, errors, keyboard navigation, pending states and reduced motion.

## Reproduce

Build with `PUBLIC_TASKILLER_API_URL=http://127.0.0.1:4173/__api`, serve preview at port 4173, then run `node scripts/capture-visual-review.mjs`. The script saves screenshots and returns a failing exit code if a route has overflow, runtime errors, or serious accessibility findings. `TASKILLER_REVIEW_URL` can select another preview origin.

## Coverage

Landing, login, registration, password recovery, password reset, email verification, account deletion, offline, 404, Today, Inbox, Projects, work detail, Focus Plan, Execution Session, History, Analytics, Settings, and App guide. Responsive and theme checks include every route, including routes without a saved PNG.

## Design detector review

Six mechanical warnings were reviewed. Navigation and history rails communicate selection/state; Project rails identify work kind. Rounded semantic rails are intentional. Animated progress width displays authoritative session progress. Menu hover indentation is a small interaction response. These are not unexplained decorations. No detector errors were found.

## Selected captures

| Surface | Desktop | Phone |
| --- | --- | --- |
| Landing | [Light](landing-desktop-light.png) / [Dark](landing-desktop-dark.png) | [Light](landing-mobile-light.png) / [Dark](landing-mobile-dark.png) |
| Today | [Light](today-desktop-light.png) / [Dark](today-desktop-dark.png) | [Light](today-mobile-light.png) / [Dark](today-mobile-dark.png) |
| Focus | [Light](session-desktop-light.png) / [Dark](session-desktop-dark.png) | [Light](session-mobile-light.png) / [Dark](session-mobile-dark.png) |
| Profile and Settings | [Light](settings-desktop-light.png) / [Dark](settings-desktop-dark.png) | [Light](settings-mobile-light.png) / [Dark](settings-mobile-dark.png) |
| Analytics | [Light](analytics-desktop-light.png) | [Light](analytics-mobile-light.png) |
