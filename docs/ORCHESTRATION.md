# Orchestration Contract

Career-Ops supports **multiple coding-agent harnesses**:

- **Claude Code and OpenCode are first-class supported adapters**
- `modes/*.md` remain the workflow source of truth
- shared orchestration behavior lives here instead of in any one harness

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
- `.opencode/opencode.jsonc`
- `.opencode/agents/*`
- `.opencode/commands/*`
- `.opencode/skills/*`
- `.opencode/plugins/*`

## Commands, skills, and agents

Career-Ops separates entrypoints from execution:

- **commands / skills** route user input to the correct mode
- **agents** execute the mode with the required context

Harness policy:

1. If the harness supports project skills and the `career-ops` skill exists, load the skill router first
2. Otherwise use the command router
3. The selected router then dispatches to the correct mode and agent

OpenCode may expose both:

- `.opencode/commands/career-ops.md`
- `.opencode/skills/career-ops/SKILL.md` (Claude-compatible skill format)

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

The repo currently ships first-class adapters for Claude Code and OpenCode.

| Capability | Claude Code path | OpenCode path |
|---|---|---|
| Command / skill router | `.claude/skills/career-ops/SKILL.md` | `.opencode/commands/career-ops.md` or `.opencode/skills/career-ops/SKILL.md` |
| Session instructions | `CLAUDE.md` + `docs/ORCHESTRATION.md` | `.opencode/agents/*.md` + `docs/ORCHESTRATION.md` |
| Specialist agents | Claude subagents | OpenCode agents/subagents |
| Hooks / lifecycle | `.claude/settings.json` hooks | `.opencode/plugins/*.mjs` |
| Browser automation | browser tools | OpenCode browser tooling and/or Playwright MCP |
| Web fetch/search | WebFetch/WebSearch | OpenCode web tools and/or MCP servers |
| File editing | Read/Write/Edit | native OpenCode file tools |
| Shell execution | Bash | native OpenCode shell tool |
| Headless workers | `claude -p` | `opencode run`, shared server clients, or SDK wrapper via `orchestration/run-agent.mjs` |

### OpenCode CLI contract

When `orchestration/run-agent.mjs` launches `opencode run`, it combines prompts as:

1. resolved system prompt
2. separator `---`
3. `User request:`
4. invocation prompt

`CAREER_OPS_OPENCODE_RUN_ARGS` is intended for simple quoted CLI flags such as provider, model, or shared-server client flags. Use the SDK path if you need more complex argument escaping or orchestration.

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

- `CAREER_OPS_AGENT_PROVIDER=auto|opencode|claude` selects the **coding-agent harness adapter**
- `CAREER_OPS_OPENCODE_MODE=cli|sdk`
- `CAREER_OPS_OPENCODE_BIN` to override the `opencode` executable
- `CAREER_OPS_OPENCODE_RUN_ARGS` to pass any OpenCode-supported **LLM provider / model / client / server flags**
- `CAREER_OPS_OPENCODE_SDK_CMD` to point at an SDK-backed worker command
- `CAREER_OPS_CLAUDE_BIN` to override the `claude` executable

OpenCode execution modes:

- standalone CLI invocation
- multiple CLI clients connected to a shared OpenCode server
- SDK-backed worker execution

Expected invariants:

- report numbering stays sequential
- worker output still lands in `reports/`, `output/`, and `batch/tracker-additions/`
- `merge-tracker.mjs`, `verify-pipeline.mjs`, and `normalize-statuses.mjs` remain valid without modification to their contracts

## Migration rule

When adding new orchestration behavior:

1. Put shared behavior here first
2. Keep provider adapters thin
3. Avoid embedding provider-specific assumptions in `modes/*.md`
4. Do not hardcode a single OpenCode LLM provider or model; allow any provider/model/client flags supported by the user's OpenCode runtime
