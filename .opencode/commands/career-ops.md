---
description: Career-Ops router command
agent: career-ops
---

Read `docs/ORCHESTRATION.md` first.

Commands route input; agents execute the resolved mode. If your OpenCode setup supports project skills, `.opencode/skills/career-ops/SKILL.md` is the equivalent skill router.

Determine the mode from the command arguments using this contract:

- empty → discovery
- JD text or JD URL without explicit sub-command → auto-pipeline
- `oferta`, `ofertas`, `contacto`, `deep`, `pdf`, `training`, `project`, `tracker`, `pipeline`, `apply`, `scan`, `batch` → same-named mode

Then load the required mode files from the context loading contract in `docs/ORCHESTRATION.md`.

If the mode is:

- `scan` → prefer `career-ops-scan`
- `apply` → prefer `career-ops-apply`
- `pipeline` with 3+ pending URLs → prefer `career-ops-pipeline`
- `batch` → prefer `career-ops-batch`

For discovery, show the current Career-Ops command menu.
