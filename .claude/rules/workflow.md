---
description: Git workflow rules for DocDefend — always use branches and PRs, never push directly to main
---

Never push directly to `main`. For every change, no matter how small:

1. Create a branch: `git checkout -b <type>/<short-description>` (e.g. `fix/login-bug`, `feat/new-report`, `chore/update-deps`)
2. Commit changes to that branch
3. Push the branch and open a PR via `gh pr create`
4. Ask the user: "Want me to merge this, or would you like to review it first?"
5. Merge only after the user confirms

Branch naming:
- `feat/` — new features
- `fix/` — bug fixes
- `chore/` — maintenance, deps, config
- `security/` — security patches
- `docs/` — documentation only

If the user says "just do it" or "go ahead and merge", merge immediately without asking again.
