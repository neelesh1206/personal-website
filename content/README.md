# Content files

This directory holds source-of-truth content for the `/admin/coding-prep` page.

## Files

| File                       | Purpose                                                                                                                                               | How to update                                                                                                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coding-prep-plan.json`    | The 10-day plan rendered on the "10-Day Plan" tab.                                                                                                    | Edit JSON directly. New task entries must have a stable `id` — those IDs key the `prep_progress` table in Neon. **Never rename an existing `id`** without manually re-keying the DB row, or you'll silently lose completed-state for that task. |
| `coding-prep-library.json` | Reference Library Q&A grouped by topic. Rendered on the "Reference Library" tab with client-side search.                                              | Edit JSON directly. Each item has `{ id, question, answer, projectUsage, remember? }`. IDs are not persisted to the DB, so they can change freely.                                                                                              |
| `interview-prep.md`        | Human-readable narrative source of the Library content. Kept alongside so the markdown is editable in prose form before being mirrored into the JSON. | Edit the markdown for readability; when content stabilises, hand-mirror into `coding-prep-library.json`.                                                                                                                                        |

## Shape of `coding-prep-plan.json`

```ts
{
  meta: { title, subtitle, timePerDay, split, language },
  rules: [{ id, title, body }],
  dailyStructure: [{ block, body }],
  days: [
    {
      day: number,                                // 1..10
      title: string,
      coding: {
        pattern: string,
        guidance?: string,
        tasks: [{ id, label }],                   // ids like 'd1-c-two-sum'
      },
      systemDesign: {
        topic: string,
        concepts: string,
        anchor: string,                           // the "how I used it" link to a real project
        tasks: [{ id, label }],
      },
      wrapup: [{ id, label }],
    },
  ],
  patterns: [{ name, when }],
  framework: { title, tagline, steps: [...], advantage }
}
```

## Shape of `coding-prep-library.json`

```ts
{
  meta: { title, subtitle },
  deliveryRules: string[],
  rapidFire: {
    versions: [{ tool, version, where }],
    numbers:  [{ label, value }],
  },
  topics: [
    {
      id: string,                                 // 'frontend', 'java-spring', ...
      name: string,
      anchor: string,                             // one-sentence project anchor for the topic
      items: [
        {
          id: string,                             // any stable string, not persisted to DB
          question: string,
          answer: string,                         // 5-10 lines, ~30-45 sec spoken
          projectUsage: string,                   // one line tying to PRISM/Tempo/etc.
          remember?: string,                      // one-line memory hook
        },
      ],
    },
  ],
}
```

## DB schema dependency

The page reads/writes two tables:

- `prep_progress(task_id TEXT PRIMARY KEY, completed TIMESTAMP)` — one row per completed task. Existence = checked.
- `prep_notes(day CHAR(2) PRIMARY KEY, body TEXT, updated_at TIMESTAMP)` — one row per day (`'01'` through `'10'`).

Migration file: `db/migrations/0002_old_stardust.sql`. Auto-applied to prod by `.github/workflows/db-migrate.yml` on push.

## Renaming tasks safely

If you must rename a task `id`:

1. Add the new task with the new `id`.
2. In the DB, copy the row from the old `task_id` to the new one:
   ```sql
   INSERT INTO prep_progress (task_id, completed)
   SELECT '<new-id>', completed FROM prep_progress WHERE task_id = '<old-id>'
   ON CONFLICT DO NOTHING;
   DELETE FROM prep_progress WHERE task_id = '<old-id>';
   ```
3. Remove the old task from the JSON.

Or just accept the lost checkmark — it's only a personal prep tool.
