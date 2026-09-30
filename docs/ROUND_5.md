# Round 5 — Analytics and History

Round 5 turns Taskiller's execution history into inspectable evidence rather than a decorative dashboard.

## History

`/history` is now a first-class route in desktop and mobile navigation.

It supports:

- 7 / 30 / 90 day and all-time windows;
- running, paused, completed and abandoned state filters;
- optional `?workItemId=` scoping from a Project, Sprint or Chore;
- 25-row cursor pagination with “Load older sessions”;
- lazy work-item identity lookup with TanStack Query caching;
- direct links to the immutable session record and the underlying work item.

The session row reports the elapsed wall-clock window, plan segment count and stored strategy. It does not mislabel wall-clock time as active work.

## Analytics

`/analytics` now reads the backend analytics endpoints directly:

- `GET /api/v1/analytics/summary`
- `GET /api/v1/analytics/timeseries`
- `GET /api/v1/analytics/work-types`
- `GET /api/v1/analytics/work-items/{workItemId}`
- `GET /api/v1/analytics/focus-patterns`

The default window is 30 days with 7/30/90-day presets. Timeseries switches to weekly buckets for the 90-day view.

### Global metrics

- active work time;
- plan adherence;
- completed vs abandoned session share;
- Chores completed;
- median uninterrupted work block;
- median estimate error;
- median start delay.

### Visualizations

Round 5 intentionally adds no charting dependency. Activity and hour-of-day charts are lightweight Svelte/CSS primitives with accessible titles and text explanations.

- Activity chart stacks active work, break and paused seconds.
- Time-of-day chart shows observed active work by hour.
- Median focus review availability is shown separately; Taskiller does not claim that the hour caused the score.

### Work-type evidence

Work types are compared by:

- active work;
- session count;
- completion rate;
- median focus review;
- median estimate error.

The focus-pattern panel only labels a work type as personalization-eligible when the backend says `recommendationPersonalizationEligible=true`.

## Work-item drill-down

Every Project, Sprint and Chore detail route now includes a 30-day “Observed execution” card showing:

- active work;
- session count;
- plan adherence;
- estimate error;
- a direct link to filtered session history.

The backend's work-item analytics endpoint is hierarchical, so Project/Sprint context remains server-authoritative.

## Interpretation policy

Round 5 is deliberately conservative with language:

- no productivity score;
- no “best hour” claim;
- no claim that a timer strategy caused better focus;
- no attempt to infer causal effects from descriptive history;
- signed estimate error is shown for calibration rather than graded as good/bad.

## Next round

Round 6 should complete account/settings operations: preferences, active devices/sessions, data export, account deletion, verification/reset surfaces and privacy UX.
