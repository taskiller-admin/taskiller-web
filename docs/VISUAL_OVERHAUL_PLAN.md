# Visual overhaul implementation and validation

1. Replace shared visual foundations: semantic palette, self-hosted typography, dimensional surfaces, responsive navigation, state/interaction motion and button loading.
2. Redesign all public/authentication routes around the focus-orbit signature while preserving form behavior and copy needed for accessibility.
3. Redesign every workspace route and its feature components, preserving domain behavior, data authenticity, concurrency and existing accessibility.
4. Add deterministic geometric avatars, device-local generator controls, shared rendering and persistence coverage.
5. Verify auth loading, logout, route navigation, action pending states and reduced motion with browser tests; run the full desktop/mobile regression suite.
6. Run API compatibility/type reproducibility, Svelte check, release check, and Vercel production build. Capture desktop/mobile light/dark screenshots for representative views and verify route coverage/overflow/accessibility in one batch, fix findings, confirm once.
7. Review diff, commit and push; inspect GitHub CI through completion.
