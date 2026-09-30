# Taskiller Design Overhaul — Kinetic Instrument Panel

Prepared against frontend `main` commit:

`31a5f2ffdaa8ed5984c7f8e6514a82a14662fe3e`

## Design read

Taskiller is an execution-focused productivity product for users who want momentum without project-management ceremony.

**Direction:** kinetic instrument panel — tactile, precise, high-contrast, calm at rest and visibly reactive to input.

- Design variance: **8 / 10**
- Motion intensity: **7 / 10**
- Visual density: **5 / 10**

## Skill guidance applied

### Anthropic `frontend-design`
- Removed the generic SaaS-card look as the dominant pattern.
- Reduced repeated all-caps eyebrow labels.
- Made the landing hero a product-specific interactive moment.
- Motion is concentrated at page/interaction boundaries rather than scattered decorative fades.
- Typography and layout carry more personality than gradient decoration.

### `design-taste-frontend` + `redesign-existing-projects`
- Audit-first rather than framework rewrite.
- Broke the standard dashboard-left-sidebar pattern.
- Introduced asymmetric Project grids.
- Added tactile hover/press feedback and visible focus.
- Kept Phosphor rather than switching to a default icon set.
- Dark mode is complete, not a random dark section.
- Added subtle texture and cursor-reactive spotlighting without coating every surface in glass.

### Vercel Web Interface Guidelines
- Motion uses transform/opacity-oriented transitions and honors reduced motion.
- Icon buttons remain labelled.
- Theme uses `color-scheme: dark`.
- Native select/input colors are explicit.
- Touch targets and safe-area mobile navigation are preserved.
- Keyboard command palette uses semantic buttons/dialog behavior.

### Designed-by-AI / Sleek skill
The linked skill is mobile/Sleek-specific and requires a Sleek API key, so its API workflow was not applicable to this SvelteKit web implementation. The transferable guidance was applied: write one opinionated style direction, update navigation as part of the redesign, and treat screenshots/code as a whole-system target rather than redesigning isolated screens.

## Core palette

### Light
- Background: `#edf2f4`
- Surface: `#f9fbfb`
- Raised: `#ffffff`
- Ink: `#111317`
- Muted: `#6a7480`
- Strike: `#ff633f`

### Dark
- Background: `#090c10`
- Surface: `#11161c`
- Raised: `#171d24`
- Foreground: `#f3f6f8`
- Muted: `#8f9aa7`
- Strike: `#ff6a47`

Strike Orange remains the identity/action color. Blue remains a supporting system color, not a second decorative accent.

## Major changes

1. **Floating command rail** replaces the permanent desktop sidebar.
2. **⌘/Ctrl K command palette** adds a fast navigation layer.
3. **Light / Dark / System** theme persists per-device and initializes before Svelte renders.
4. **Interactive landing hero** uses pointer-driven parallax to connect hierarchy → execution.
5. **Cursor spotlight surfaces** add life to Project, metric, and focus surfaces.
6. **Today** becomes a clearer execution runway with a stronger capture deck.
7. **Projects** uses an asymmetric 7/5 column rhythm instead of equal cards.
8. **Inbox** uses tactile filter segments and a more active list surface.
9. **Analytics** bars animate from the baseline and react on hover.
10. **Reduced motion** disables the new movement automatically.

## Validation to run after applying

```bash
npm run check
npm run release:check
npm run build
npm run test:e2e
```

Then review both themes manually on:
- `/`
- `/today`
- `/inbox`
- `/projects`
- `/analytics`
- `/settings`
- one `/work/:id`
- one `/session/:id`
