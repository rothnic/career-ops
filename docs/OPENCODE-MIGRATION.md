# OpenCode Migration Guide

Career-Ops now treats **OpenCode as the primary orchestration harness** and **Claude Code as a compatibility adapter**.

## Mapping from Claude to OpenCode

| Claude concept | New OpenCode path |
|---|---|
| `CLAUDE.md` root instructions | `docs/ORCHESTRATION.md` + `.opencode/agents/*.md` |
| `.claude/skills/career-ops/SKILL.md` | `.opencode/commands/career-ops.md` |
| Claude hooks in `.claude/settings.json` | `.opencode/plugins/*.mjs` |
| Claude subagents | OpenCode specialized agents |
| `claude -p` batch workers | `opencode run` via `orchestration/run-agent.mjs` |

## Capability matrix

Every existing Claude-oriented repository behavior has an OpenCode path:

| Repo capability | OpenCode mechanism |
|---|---|
| Slash-style router | project command in `.opencode/commands/` |
| Shared session instructions | agent files + `docs/ORCHESTRATION.md` |
| Specialized workers | project agents/subagents |
| Hooked lifecycle behavior | plugins |
| Permission rules | `opencode.json` |
| Browser automation | browser tooling and/or Playwright MCP |
| Headless orchestration | `opencode run` or SDK wrapper |
| File/shell tools | native OpenCode tools |

## Running with OpenCode

### Interactive project usage

1. Install OpenCode
2. Open the repo with `opencode`
3. Run `/career-ops ...`

### Batch workers

OpenCode is the default batch provider:

```bash
bash batch/batch-runner.sh
```

Optional selectors:

```bash
CAREER_OPS_AGENT_PROVIDER=opencode
CAREER_OPS_OPENCODE_MODE=cli
bash batch/batch-runner.sh
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
  "systemPrompt": "resolved system prompt",
  "systemPromptFile": "/absolute/path/to/file.md"
}
```

## Keeping Claude optional

Claude Code still works through the compatibility adapter:

```bash
CAREER_OPS_AGENT_PROVIDER=claude bash batch/batch-runner.sh
```

Use Claude when you explicitly want the old harness. Use OpenCode for the default path.
