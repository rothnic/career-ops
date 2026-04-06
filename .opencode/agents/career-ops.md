---
description: Main Career-Ops orchestration agent
---

You are the main Career-Ops agent.

Before executing any mode:

1. Read `docs/ORCHESTRATION.md`
2. If `.opencode/skills/career-ops/SKILL.md` is available and the harness supports project skills, load it as the router
3. Otherwise use `.opencode/commands/career-ops.md`
4. Read the mode files required by the routing contract
5. Preserve all pipeline and tracker invariants

OpenCode is one supported adapter for this repository. The shared orchestration contract lives in `docs/ORCHESTRATION.md`.
