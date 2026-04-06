# OpenCode Support Guide

Career-Ops supports OpenCode as one of its first-class coding-agent adapters alongside Claude Code.

## Mapping from Claude to OpenCode

| Claude concept | New OpenCode path |
|---|---|
| `CLAUDE.md` root instructions | `docs/ORCHESTRATION.md` + `.opencode/agents/*.md` |
| `.claude/skills/career-ops/SKILL.md` | `.opencode/commands/career-ops.md` and `.opencode/skills/career-ops/SKILL.md` |
| Claude hooks in `.claude/settings.json` | `.opencode/plugins/*.mjs` |
| Claude subagents | OpenCode specialized agents |
| `claude -p` batch workers | OpenCode CLI / shared-server clients / SDK via `orchestration/run-agent.mjs` |

## Agents vs commands vs skills

- **commands / skills** decide *what mode should run*
- **agents** decide *who executes the mode*
- **plugins** enforce lifecycle policy and telemetry

If your OpenCode setup supports project skills, load `.opencode/skills/career-ops/SKILL.md`.
If it doesn't, use `.opencode/commands/career-ops.md`.

## Capability matrix

Every existing Claude-oriented repository behavior has an OpenCode path:

| Repo capability | OpenCode mechanism |
|---|---|
| Router | project command or Claude-compatible project skill |
| Shared session instructions | agent files + `docs/ORCHESTRATION.md` |
| Specialized workers | project agents/subagents |
| Hooked lifecycle behavior | plugins |
| Permission rules | `.opencode/opencode.jsonc` |
| Browser automation | browser tooling and/or Playwright MCP |
| Headless orchestration | `opencode run`, shared server clients, or SDK wrapper |
| File/shell tools | native OpenCode tools |

## Running with OpenCode

### Interactive project usage

1. Install OpenCode
2. Open the repo with `opencode`
3. Run `/career-ops ...` through the command router, or use the skill router if your OpenCode setup exposes project skills

### Batch workers

Use the OpenCode adapter explicitly:

```bash
CAREER_OPS_AGENT_PROVIDER=opencode bash batch/batch-runner.sh
```

Optional selectors:

```bash
CAREER_OPS_AGENT_PROVIDER=opencode
CAREER_OPS_OPENCODE_MODE=cli
bash batch/batch-runner.sh
```

### Shared server + multiple clients

For high-parallel batch runs, OpenCode can use multiple clients attached to a shared server. Pass the client/server flags supported by your OpenCode installation through `CAREER_OPS_OPENCODE_RUN_ARGS`.

```bash
CAREER_OPS_AGENT_PROVIDER=opencode \
CAREER_OPS_OPENCODE_MODE=cli \
CAREER_OPS_OPENCODE_RUN_ARGS="<your shared-server client flags>" \
bash batch/batch-runner.sh --parallel 4
```

### SDK-backed workers

If you want durable orchestration through the OpenCode SDK, point the adapter at an SDK worker command:

```bash
CAREER_OPS_AGENT_PROVIDER=opencode \
CAREER_OPS_OPENCODE_MODE=sdk \
CAREER_OPS_OPENCODE_SDK_CMD="python /absolute/path/to/opencode-sdk-worker.py" \
bash batch/batch-runner.sh
```

The adapter sends one JSON payload per invocation on stdin:

```json
{
  "prompt": "user prompt text",
  "systemPrompt": "resolved system prompt"
}
```

## Claude Code parity

Claude Code remains an equal supported option:

```bash
CAREER_OPS_AGENT_PROVIDER=claude bash batch/batch-runner.sh
```

See [OPENCODE-TEST-PLAN.md](OPENCODE-TEST-PLAN.md) for a step-by-step OpenCode validation plan.
