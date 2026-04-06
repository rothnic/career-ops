---
name: career-ops
description: AI job search command center -- evaluate offers, generate CVs, scan portals, track applications
user_invocable: true
args: mode
---

# career-ops -- OpenCode Skill Router

Read `docs/ORCHESTRATION.md` before routing.

This is the OpenCode skill-compatible wrapper for the same routing contract used by `.opencode/commands/career-ops.md`.

## Mode Routing

Determine the mode from `{{mode}}`:

| Input | Mode |
|-------|------|
| (empty / no args) | `discovery` -- Show command menu |
| JD text or URL (no sub-command) | **`auto-pipeline`** |
| `oferta` | `oferta` |
| `ofertas` | `ofertas` |
| `contacto` | `contacto` |
| `deep` | `deep` |
| `pdf` | `pdf` |
| `training` | `training` |
| `project` | `project` |
| `tracker` | `tracker` |
| `pipeline` | `pipeline` |
| `apply` | `apply` |
| `scan` | `scan` |
| `batch` | `batch` |

If project skills are available, agents should load this skill router before executing the mode. Otherwise they should use the command router.

After determining the mode, follow the shared context loading and delegation rules in `docs/ORCHESTRATION.md`.
