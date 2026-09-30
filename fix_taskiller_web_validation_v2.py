#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
import json
import subprocess
import sys

EXPECTED_HEAD = "fcba2b64559b07519dcd75b025ce879aa9d8e488"


def root() -> Path:
    p = Path.cwd()
    if not (p / "package.json").exists():
        raise SystemExit("Run this script from the taskiller-web repository root.")
    return p


ROOT = root()


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_if_present(path: str, old: str, new: str) -> bool:
    content = read(path)
    if old not in content:
        return False
    write(path, content.replace(old, new, 1))
    print(f"patched {path}")
    return True


def current_head() -> str | None:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return None


head = current_head()
if head and head != EXPECTED_HEAD:
    print(
        f"Note: HEAD is {head}; this fixer was prepared against {EXPECTED_HEAD}. "
        "It only applies guarded replacements and is safe to re-run.",
        file=sys.stderr,
    )

# ---------------------------------------------------------------------------
# 1. Remaining Svelte warnings: make intentional initial-prop snapshots happen
#    through closures, as Svelte 5 recommends.
# ---------------------------------------------------------------------------

replace_if_present(
    "src/lib/components/work/WorkComposer.svelte",
    """  const queryClient = useQueryClient();
  let name = $state('');
  let kind = $state<WorkItemKind>(defaultKind);
  let description = $state('');
  let estimateMinutes = $state('');
  let priority = $state('');
  let deadline = $state('');
  let targetStartDate = $state('');
  let targetEndDate = $state('');
  let advanced = $state(!compact);
  let error = $state('');
""",
    """  const queryClient = useQueryClient();

  function initialKind(): WorkItemKind {
    return defaultKind;
  }

  function initialAdvanced(): boolean {
    return !compact;
  }

  let name = $state('');
  let kind = $state<WorkItemKind>(initialKind());
  let description = $state('');
  let estimateMinutes = $state('');
  let priority = $state('');
  let deadline = $state('');
  let targetStartDate = $state('');
  let targetEndDate = $state('');
  let advanced = $state(initialAdvanced());
  let error = $state('');
""",
)

replace_if_present(
    "src/lib/components/work/WorkEditor.svelte",
    """  const queryClient = useQueryClient();
  let name = $state(item.name);
  let description = $state(item.description ?? '');
  let status = $state<WorkItemStatus>(item.status);
  let parentId = $state(item.parentId ?? '');
  let estimateMinutes = $state(item.estimatedEffortSeconds === null ? '' : String(Math.round(item.estimatedEffortSeconds / 60)));
  let priority = $state(item.priority === null ? '' : String(item.priority));
  let plannedStart = $state(toLocalDateTime(item.plannedStartAt));
  let deadline = $state(toLocalDateTime(item.deadlineAt));
  let targetStartDate = $state(item.targetStartDate ?? '');
  let targetEndDate = $state(item.targetEndDate ?? '');
  let conflict = $state(false);
  let error = $state('');
""",
    """  const queryClient = useQueryClient();

  function initialDraft() {
    return {
      name: item.name,
      description: item.description ?? '',
      status: item.status,
      parentId: item.parentId ?? '',
      estimateMinutes:
        item.estimatedEffortSeconds === null
          ? ''
          : String(Math.round(item.estimatedEffortSeconds / 60)),
      priority: item.priority === null ? '' : String(item.priority),
      plannedStart: toLocalDateTime(item.plannedStartAt),
      deadline: toLocalDateTime(item.deadlineAt),
      targetStartDate: item.targetStartDate ?? '',
      targetEndDate: item.targetEndDate ?? ''
    };
  }

  const initial = initialDraft();
  let name = $state(initial.name);
  let description = $state(initial.description);
  let status = $state<WorkItemStatus>(initial.status);
  let parentId = $state(initial.parentId);
  let estimateMinutes = $state(initial.estimateMinutes);
  let priority = $state(initial.priority);
  let plannedStart = $state(initial.plannedStart);
  let deadline = $state(initial.deadline);
  let targetStartDate = $state(initial.targetStartDate);
  let targetEndDate = $state(initial.targetEndDate);
  let conflict = $state(false);
  let error = $state('');
""",
)

# ---------------------------------------------------------------------------
# 2. Dynamic [id] routes. SvelteKit's runtime guarantees id for these routes,
#    but $app/state's general params type remains string | undefined.
#    Keep it reactive so navigation /work/A -> /work/B without a remount works.
# ---------------------------------------------------------------------------

for path in [
    "src/routes/(app)/session/[id]/+page.svelte",
    "src/routes/(app)/work/[id]/+page.svelte",
    "src/routes/(app)/work/[id]/plan/+page.svelte",
]:
    replace_if_present(
        path,
        "  const id = page.params.id;",
        "  let id = $derived(page.params.id ?? '');",
    )

# ---------------------------------------------------------------------------
# 3. noUncheckedIndexedAccess makes array indexing possibly undefined.
# ---------------------------------------------------------------------------

replace_if_present(
    "src/routes/(app)/work/[id]/plan/+page.svelte",
    """  function moveSegment(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= segments.length) return;
    const next = [...segments];
    [next[index], next[target]] = [next[target], next[index]];
    segments = next;
  }
""",
    """  function moveSegment(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= segments.length) return;

    const next = [...segments];
    const currentSegment = next[index];
    const targetSegment = next[target];
    if (!currentSegment || !targetSegment) return;

    next[index] = targetSegment;
    next[target] = currentSegment;
    segments = next;
  }
""",
)

# ---------------------------------------------------------------------------
# 4. Accessibility warning from both svelte-check and Vite.
# ---------------------------------------------------------------------------

replace_if_present(
    "src/routes/(app)/work/[id]/plan/+page.svelte",
    """              <label class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Plan name</label>
              <Input class="mt-1.5 bg-white" bind:value={planName} placeholder="Focus plan" />
""",
    """              <label for="focus-plan-name" class="text-[11px] font-bold uppercase tracking-[0.12em] text-tk-graphite">Plan name</label>
              <Input id="focus-plan-name" class="mt-1.5 bg-white" bind:value={planName} placeholder="Focus plan" />
""",
)

# ---------------------------------------------------------------------------
# 5. Windows local build: @sveltejs/adapter-vercel creates function symlinks.
#    Windows without Developer Mode/elevation rejects those with EPERM.
#
#    Local builds use adapter-node. GitHub CI and Vercel production continue
#    using adapter-vercel, so deployment output is unchanged.
# ---------------------------------------------------------------------------

package_path = ROOT / "package.json"
pkg = json.loads(package_path.read_text(encoding="utf-8"))
dev = pkg.setdefault("devDependencies", {})
if dev.get("@sveltejs/adapter-node") != "5.5.7":
    dev["@sveltejs/adapter-node"] = "5.5.7"
    package_path.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")
    print("patched package.json (@sveltejs/adapter-node 5.5.7)")

config_path = "svelte.config.js"
old_config = """import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
"""
new_config = """import nodeAdapter from '@sveltejs/adapter-node';
import vercelAdapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const productionVercelBuild = Boolean(process.env.VERCEL || process.env.CI);
"""
replace_if_present(config_path, old_config, new_config)

replace_if_present(
    config_path,
    "    adapter: adapter(),",
    "    adapter: productionVercelBuild ? vercelAdapter() : nodeAdapter({ out: 'build' }),",
)

print()
print("Remaining validation/build fixes applied.")
print()
print("Because package.json changed, install once to update package-lock.json:")
print("  npm install")
print()
print("Then run:")
print("  npm run check")
print("  npm run release:check")
print("  npm run build")
print()
print("If those pass:")
print("  npx playwright install chromium")
print("  npm run test:e2e")
