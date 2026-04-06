# Orchestration Contract

Career-Ops is now **provider-agnostic**:

- **OpenCode is the primary harness**
- **Claude Code is an optional compatibility harness**
- `modes/*.md` remain the workflow source of truth

## Canonical instruction tree

The orchestration layer must treat these files as the contract:

1. `docs/ORCHESTRATION.md` — shared provider-neutral rules
2. `modes/_shared.md` — shared evaluation policy and tool guidance
3. `modes/{mode}.md` — mode-specific behavior
4. `cv.md`, `article-digest.md`, `config/profile.yml`, `portals.yml` — candidate/runtime inputs
5. `templates/states.yml` — canonical tracker states

Provider-specific files are adapters only:

- `CLAUDE.md`
- `.claude/skills/career-ops/SKILL.md`
- `.opencode/agents/*`
- `.opencode/commands/*`
- `.opencode/plugins/*`

## Routing contract

The command router must preserve the current behavior:

| Input | Mode |
|---|---|
| empty | discovery |
| JD text or JD URL without explicit sub-command | auto-pipeline |
| `oferta` | oferta |
| `ofertas` | ofertas |
| `contacto` | contacto |
| `deep` | deep |
| `pdf` | pdf |
| `training` | training |
| `project` | project |
| `tracker` | tracker |
| `pipeline` | pipeline |
| `apply` | apply |
| `scan` | scan |
| `batch` | batch |

## Context loading contract

### Shared-context modes
Load `modes/_shared.md` + `modes/{mode}.md`

Applies to:

- `auto-pipeline`
- `oferta`
- `ofertas`
- `pdf`
- `contacto`
- `apply`
- `pipeline`
- `scan`
- `batch`

### Standalone modes
Load only `modes/{mode}.md`

Applies to:

- `tracker`
- `deep`
- `training`
- `project`

### Specialized-agent delegation

For `scan`, `apply`, and `pipeline` with 3+ URLs, the harness should prefer a specialized child agent so the main session stays small.

## Tool compatibility matrix

All current Claude Code behavior must be reproducible through OpenCode tools, plugins, MCP servers, or CLI/SDK orchestration.

| Capability | Claude Code today | OpenCode path |
|---|---|---|
| Router command | `.claude/skills/career-ops/SKILL.md` | `.opencode/commands/career-ops.md` |
| Session instructions | `CLAUDE.md` | `.opencode/agents/*.md` + `docs/ORCHESTRATION.md` |
| Specialist agents | Claude subagents | OpenCode agents/subagents |
| Hooks | `.claude/settings.json` hooks | `.opencode/plugins/*.mjs` |
| Browser automation | browser tools | OpenCode browser tooling and/or Playwright MCP |
| Web fetch/search | WebFetch/WebSearch | OpenCode web tools and/or MCP servers |
| File editing | Read/Write/Edit | native OpenCode file tools |
| Shell execution | Bash | native OpenCode shell tool |
| Headless workers | `claude -p` | `opencode run` or SDK wrapper via `orchestration/run-agent.mjs` |

## Plugin and hook contract

OpenCode plugins should cover the repo-level behavior previously documented as Claude hooks:

- session initialization
- permission policy
- tool execution guards
- telemetry/logging
- post-tool cleanup

At minimum, the harness must preserve these repo safety constraints:

1. Never parallelize Playwright access across multiple agents sharing one browser
2. Keep output contracts stable for reports, PDFs, and tracker TSV files
3. Keep tracker and pipeline invariants unchanged

## Batch orchestration contract

`batch/batch-runner.sh` must call the provider-neutral entrypoint:

- `node orchestration/run-agent.mjs`

Environment selectors:

- `CAREER_OPS_AGENT_PROVIDER=opencode|claude`
- `CAREER_OPS_OPENCODE_MODE=cli|sdk`
- `CAREER_OPS_OPENCODE_BIN` to override the `opencode` executable
- `CAREER_OPS_OPENCODE_SDK_CMD` to point at an SDK-backed worker command
- `CAREER_OPS_CLAUDE_BIN` to override the `claude` executable

Expected invariants:

- report numbering stays sequential
- worker output still lands in `reports/`, `output/`, and `batch/tracker-additions/`
- `merge-tracker.mjs`, `verify-pipeline.mjs`, and `normalize-statuses.mjs` remain valid without modification to their contracts

## Migration rule

When adding new orchestration behavior:

1. Put shared behavior here first
2. Keep provider adapters thin
3. Avoid embedding provider-specific assumptions in `modes/*.md`
