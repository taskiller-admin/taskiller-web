# Taskiller Portable Work v1 — Import/Export Specification and LLM Generation Guide

**Purpose:** Give this document to an LLM to generate Projects, Sprints, and Chores that can be imported into Taskiller. This describes the **portable work** feature, **not** the separate account-data export in Settings.

**Grounded in implementation:** `taskiller-web/src/lib/portable/format.ts`, `operations.ts`, and `taskiller-backend/src/taskiller/django_api/portable_import.py` (repository state reviewed 2026-10-12).

## 1. Supported files and workflow

- **JSON:** Save a UTF-8 file ending in `.json`. The entire file is **one portable document JSON object**, not an array and not Markdown.
- **ZIP:** A `.zip` archive with a `data.json` at the **archive root**. That file contains the exact same portable document object. Exports may also have `README.md` (human-readable companion, not used for import) and `manifest.json`.
- **Use in Taskiller:** Click the Import (upload) icon in the global top bar, select the JSON/ZIP, inspect the preview, confirm and start the import. Importing uses one backend transaction: **all items or none**. It creates **new IDs** and imports work items in **Draft** state; it does not overwrite existing items.
- **Export:** Click the Export (download) icon in the global bar. Choose workspace versus a root item and automatic, JSON or ZIP. The archive's `data.json` remains the canonical machine-readable data. Format choice and readable Markdown are export options, not additional schema fields.
- **Limits:** 1–1,500 `items`; 0–1,500 `workTypes`. The UI rejects input files larger than **12 MiB** and imported JSON content larger than **12 MiB**. Keep outputs much smaller where practical.

## 2. Top-level object

The object has exactly this overall shape (names are **camelCase** and case-sensitive):

```json
{
  "format": "taskiller.portable.work.v1",
  "createdAt": "2026-10-12T19:00:00Z",
  "rootSourceId": null,
  "workTypes": [],
  "items": []
}
```

| Field | Type | Meaning |
|---|---|---|
| `format` | literal string | Must be `taskiller.portable.work.v1`. |
| `createdAt` | ISO 8601 timestamp string | When the document was generated. Include `Z` or UTC offset. |
| `rootSourceId` | `string \| null` | `null` for a multi-root/workspace file; otherwise the `sourceId` of the exported root item. |
| `workTypes` | array | Definitions for custom types used by items. Existing types can be referenced by slug without redeclaring them, but for portable LLM output **declare your custom types**. |
| `items` | array | All work items being imported, including their parents and children, if any. At least one item. |

### Work Type definition (`workTypes[]`)

```json
{
  "slug": "deep_research",
  "displayName": "Deep Research",
  "description": "Extended investigation, reading, and synthesis.",
  "characteristics": {
    "cognitiveDemand": "high",
    "interruptionSensitivity": "high",
    "continuityNeed": "high",
    "repetitiveness": "low",
    "physicality": "sedentary",
    "learningMode": "acquisition"
  }
}
```

- `slug`: unique within the document, **1–64 characters**, matching `^[a-z0-9][a-z0-9_-]{0,63}$`. Lowercase ASCII letters, digits, `_` and `-`; start with a letter/digit. Slugs are stable identifiers, **not UUIDs**.
- `displayName`: nonempty string, maximum **120** characters.
- `description`: string up to **1,000** characters, or `null`.
- `characteristics`: an object with **all six** properties (the backend validates the complete set):
  - `cognitiveDemand`, `interruptionSensitivity`, `continuityNeed`, `repetitiveness`: each one of `low`, `medium`, `high`.
  - `physicality`: one of `sedentary`, `light`, `active`.
  - `learningMode`: one of `none`, `acquisition`, `retrieval`, `practice`.
- Do **not** include database-controlled fields such as `id`, `system`, or `version` in portable type definitions.
- Slugs must be unique in `workTypes`. If a slug already exists in the user's account, the importer uses the existing Work Type rather than redefining it. Choose distinctive custom slugs if you need guaranteed characteristics.

### Work item (`items[]`)

Every generated work item should include the fields below, even when a nullable field is `null`:

| Field | Type | Rules |
|---|---|---|
| `sourceId` | string | Unique **within this document** (1–200 characters). E.g. `project-01`, `sprint-01`, `chore-01`. This is *not* a database ID. |
| `parentSourceId` | string or `null` | `sourceId` of a parent **included in the same `items` array**. `null` for root items. |
| `kind` | enum | Exactly `project`, `sprint`, or `chore`. |
| `name` | string | Nonblank; max **300** characters. |
| `description` | string or `null` | Max **20,000** characters. |
| `workTypeSlug` | string or `null` | Slug declared in `workTypes` or an already existing Work Type on the destination account. |
| `position` | integer | Relative ordering among siblings (e.g. 1024, 2048, 3072). Backend currently assigns fresh positions on import, so sibling order is not guaranteed to match this field. |
| `priority` | integer or `null` | `0–5`, where a larger number indicates greater priority. |
| `estimatedEffortSeconds` | integer or `null` | `0–31536000` seconds. **Use seconds, not minutes.** E.g. 45 minutes = `2700`. |
| `plannedStartAt` | ISO datetime or `null` | With timezone (`Z` recommended). |
| `deadlineAt` | ISO datetime or `null` | With timezone; planned start must not be after deadline. |
| `targetStartDate` | ISO date or `null` | `YYYY-MM-DD`; use on **Projects**, otherwise `null`. |
| `targetEndDate` | ISO date or `null` | `YYYY-MM-DD`; use on **Projects**, otherwise `null`; no earlier than target start. |
| `characteristicOverrides` | object or `null` | Usually `null`. If specified, include only characteristic properties to override using the enum choices defined above. |

**Do not include** fields from API work-item responses such as `id`, `status`, `createdAt`, `updatedAt`, `deletedAt`, `version`, `effectiveCharacteristics`, `workTypeId` or `parentId`. The portable representation uses `sourceId`, `parentSourceId`, and `workTypeSlug`. All newly imported items become **Draft**; there is no `status` setting in the import schema.

## 3. Hierarchy constraints (critical)

```text
Project                      (parentSourceId = null)
├── Sprint                   (parentSourceId = Project sourceId)
│   ├── Chore                (parentSourceId = Sprint sourceId)
│   └── Chore
└── Chore                    (parentSourceId = Project sourceId)

Chore                        (can also be a root/Inbox chore)
```

- Projects **must** be roots. They cannot have a parent.
- Sprints **must** have a Project parent. Never create a root Sprint.
- Chores can belong to a Project, Sprint, or Inbox (root). A Chore **cannot** be a parent.
- Every non-null parent ID must reference an item in the **same** file. No cross-file parent references.
- No duplicate `sourceId`, no cycles, and no missing parents.
- `rootSourceId` can be `null` for more than one top-level item.

## 4. Complete import-ready JSON example

Save **only the following JSON**, without surrounding Markdown fences, as `sample-taskiller.json`:

```json
{
  "format": "taskiller.portable.work.v1",
  "createdAt": "2026-10-12T19:00:00Z",
  "rootSourceId": "project-001",
  "workTypes": [
    {
      "slug": "research_synthesis_example",
      "displayName": "Research & Synthesis",
      "description": "Investigate sources, evaluate evidence, and write structured conclusions.",
      "characteristics": {
        "cognitiveDemand": "high",
        "interruptionSensitivity": "high",
        "continuityNeed": "high",
        "repetitiveness": "low",
        "physicality": "sedentary",
        "learningMode": "acquisition"
      }
    }
  ],
  "items": [
    {
      "sourceId": "project-001",
      "parentSourceId": null,
      "kind": "project",
      "name": "Prepare final project proposal",
      "description": "Define a feasible problem, research prior work, and produce a reviewable proposal.",
      "workTypeSlug": null,
      "position": 1024,
      "priority": 4,
      "estimatedEffortSeconds": null,
      "plannedStartAt": null,
      "deadlineAt": null,
      "targetStartDate": null,
      "targetEndDate": null,
      "characteristicOverrides": null
    },
    {
      "sourceId": "sprint-001",
      "parentSourceId": "project-001",
      "kind": "sprint",
      "name": "Research and scope",
      "description": "Settle the project scope and collect technical references.",
      "workTypeSlug": "research_synthesis_example",
      "position": 1024,
      "priority": 4,
      "estimatedEffortSeconds": 10800,
      "plannedStartAt": null,
      "deadlineAt": null,
      "targetStartDate": null,
      "targetEndDate": null,
      "characteristicOverrides": null
    },
    {
      "sourceId": "chore-001",
      "parentSourceId": "sprint-001",
      "kind": "chore",
      "name": "Review five relevant papers",
      "description": "Summarize each paper's data, methods, limitations, and possible application to the proposed project.",
      "workTypeSlug": "research_synthesis_example",
      "position": 1024,
      "priority": 4,
      "estimatedEffortSeconds": 5400,
      "plannedStartAt": null,
      "deadlineAt": null,
      "targetStartDate": null,
      "targetEndDate": null,
      "characteristicOverrides": null
    },
    {
      "sourceId": "chore-002",
      "parentSourceId": "sprint-001",
      "kind": "chore",
      "name": "Write one-page scope and feasibility summary",
      "description": "Document the objective, inputs, success criteria, realistic resources, and expected deliverables.",
      "workTypeSlug": "research_synthesis_example",
      "position": 2048,
      "priority": 4,
      "estimatedEffortSeconds": 3600,
      "plannedStartAt": null,
      "deadlineAt": null,
      "targetStartDate": null,
      "targetEndDate": null,
      "characteristicOverrides": null
    }
  ]
}
```

The importer creates **four new work items** (one Project, one Sprint, two Chores). The new account-specific UUIDs will be different from the `sourceId` strings.

## 5. Machine-checkable JSON Schema (structure)

The following JSON Schema (Draft 2020-12) checks the main structure and basic enum/range constraints. Graph relationships, uniqueness by property, account-specific type names, and project-only date rules additionally require application-level validation as explained above.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Taskiller Portable Work v1",
  "type": "object",
  "required": ["format", "createdAt", "rootSourceId", "workTypes", "items"],
  "properties": {
    "format": { "const": "taskiller.portable.work.v1" },
    "createdAt": { "type": "string", "format": "date-time" },
    "rootSourceId": { "type": ["string", "null"] },
    "workTypes": { "type": "array", "maxItems": 1500, "items": { "$ref": "#/$defs/workType" } },
    "items": { "type": "array", "minItems": 1, "maxItems": 1500, "items": { "$ref": "#/$defs/item" } }
  },
  "additionalProperties": false,
  "$defs": {
    "intensity": { "enum": ["low", "medium", "high"] },
    "physicality": { "enum": ["sedentary", "light", "active"] },
    "learning": { "enum": ["none", "acquisition", "retrieval", "practice"] },
    "characteristics": {
      "type": "object",
      "required": ["cognitiveDemand", "interruptionSensitivity", "continuityNeed", "repetitiveness", "physicality", "learningMode"],
      "properties": {
        "cognitiveDemand": { "$ref": "#/$defs/intensity" },
        "interruptionSensitivity": { "$ref": "#/$defs/intensity" },
        "continuityNeed": { "$ref": "#/$defs/intensity" },
        "repetitiveness": { "$ref": "#/$defs/intensity" },
        "physicality": { "$ref": "#/$defs/physicality" },
        "learningMode": { "$ref": "#/$defs/learning" }
      }, "additionalProperties": false
    },
    "workType": {
      "type": "object", "required": ["slug", "displayName", "description", "characteristics"],
      "properties": {
        "slug": { "type": "string", "pattern": "^[a-z0-9][a-z0-9_-]{0,63}$" },
        "displayName": { "type": "string", "minLength": 1, "maxLength": 120 },
        "description": { "type": ["string", "null"], "maxLength": 1000 },
        "characteristics": { "$ref": "#/$defs/characteristics" }
      }, "additionalProperties": false
    },
    "item": {
      "type": "object",
      "required": ["sourceId", "parentSourceId", "kind", "name", "description", "workTypeSlug", "position", "priority", "estimatedEffortSeconds", "plannedStartAt", "deadlineAt", "targetStartDate", "targetEndDate", "characteristicOverrides"],
      "properties": {
        "sourceId": { "type": "string", "minLength": 1, "maxLength": 200 },
        "parentSourceId": { "type": ["string", "null"] },
        "kind": { "enum": ["project", "sprint", "chore"] },
        "name": { "type": "string", "minLength": 1, "maxLength": 300 },
        "description": { "type": ["string", "null"], "maxLength": 20000 },
        "workTypeSlug": { "type": ["string", "null"] },
        "position": { "type": "integer" },
        "priority": { "type": ["integer", "null"], "minimum": 0, "maximum": 5 },
        "estimatedEffortSeconds": { "type": ["integer", "null"], "minimum": 0, "maximum": 31536000 },
        "plannedStartAt": { "type": ["string", "null"], "format": "date-time" },
        "deadlineAt": { "type": ["string", "null"], "format": "date-time" },
        "targetStartDate": { "type": ["string", "null"], "format": "date" },
        "targetEndDate": { "type": ["string", "null"], "format": "date" },
        "characteristicOverrides": {
          "anyOf": [
            { "type": "null" },
            { "type": "object", "properties": {
                "cognitiveDemand": { "$ref": "#/$defs/intensity" },
                "interruptionSensitivity": { "$ref": "#/$defs/intensity" },
                "continuityNeed": { "$ref": "#/$defs/intensity" },
                "repetitiveness": { "$ref": "#/$defs/intensity" },
                "physicality": { "$ref": "#/$defs/physicality" },
                "learningMode": { "$ref": "#/$defs/learning" }
              }, "additionalProperties": false
            }
          ]
        }
      }, "additionalProperties": false
    }
  }
}
```

## 6. Copy-paste instruction for an LLM

> You are generating an **import-ready Taskiller Portable Work v1 document**. Follow the attached Taskiller Portable Work v1 specification exactly. Based on the following goal, produce coherent Projects, Sprints, and concrete, executable Chores: **[INSERT MY GOAL HERE]**. Structure every Sprint under a Project and each Chore under a Project, Sprint, or Inbox. Create meaningful Work Types using all six required characteristics, give every item a unique sourceId and in-file parentSourceId, use seconds for effort estimates, provide all item fields even when null, choose sensible priorities, avoid arbitrary dates unless I supply them, and output **only one valid JSON object** with `format: "taskiller.portable.work.v1"` — no Markdown fences or explanation. Make tasks specific and practical rather than vague.

## 7. Pre-import validation checklist

1. JSON parses as a single object; `format` matches exactly.
2. `items` contains 1–1,500 entries; all IDs are distinct, parent references exist, no cycles.
3. Every Sprint has a Project parent; Projects are roots; no Chore parents.
4. Every custom type used is declared with valid slug and **all six** characteristics, or is known to exist in the destination workspace.
5. Every work item has all the fields in §2, even when some values are `null`.
6. Estimates are integers in **seconds**, priority is `0–5`, datetimes include timezone information, and only Projects have target date ranges.
7. Save the JSON as `.json`, or put it into a ZIP at the path `data.json` (not inside a subfolder). The Markdown summary file alone is **not** importable.
8. Preview in Taskiller before confirming. Import is additive, generates new UUIDs, and creates Draft items.
