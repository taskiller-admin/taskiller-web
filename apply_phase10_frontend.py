#!/usr/bin/env python3
from pathlib import Path
import json, subprocess, sys
script_dir = Path(__file__).resolve().parent
repo = Path.cwd()
if not (repo/'package.json').exists(): raise SystemExit('Run from taskiller-web root.')
subprocess.check_call([sys.executable, str(script_dir/'apply_phase9_frontend_base.py')], cwd=repo)
package = repo/'package.json'
data = json.loads(package.read_text(encoding='utf-8'))
scripts = data.setdefault('scripts', {})
scripts['release:django'] = 'npm run check && npm run build && npm run test:e2e:django'
package.write_text(json.dumps(data, indent=2) + '\n', encoding='utf-8')
doc = repo/'PHASE10_DJANGO_FINAL.md'
doc.write_text('''# Phase 10 — Final Django Client Validation\n\nThe frontend API contract did not change during the backend migration. For final validation, start the Django backend and run:\n\n```bash\nTASKILLER_DJANGO_API_URL=http://127.0.0.1:8000 npm run release:django\n```\n\nAfter this succeeds, the Svelte client is validated against the final Django-only backend.\n''', encoding='utf-8')
print('Phase 10 frontend final validation workflow applied.')
