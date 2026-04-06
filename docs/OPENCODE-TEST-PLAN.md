# OpenCode Test Plan

Use this checklist to validate OpenCode support across the full Career-Ops system.

## 1. Config and project discovery

1. Confirm `.opencode/opencode.jsonc` is present
2. Start OpenCode in the repository root
3. Verify project agents, commands, skills, and plugins are discovered

## 2. Router parity

1. Run discovery with the command router
2. If project skills are enabled, run discovery with the OpenCode skill router
3. Confirm both routes resolve to the same command menu and mode contract

## 3. Auto-pipeline

1. Paste a local JD snippet
2. Paste a JD URL
3. Confirm the router selects `auto-pipeline`
4. Confirm required mode files load and output contracts remain unchanged

## 4. Specialized modes

1. Run `scan`
2. Run `apply`
3. Run `pipeline` with 3+ items to confirm specialized-agent delegation
4. Confirm Playwright access remains serialized

## 5. Batch via CLI

1. Run `bash batch/batch-runner.sh --dry-run`
2. Run a single-worker batch with `CAREER_OPS_AGENT_PROVIDER=opencode`
3. Confirm logs, reports, PDFs, and tracker additions still land in the expected paths

## 6. Batch via shared OpenCode server

1. Start your shared OpenCode server using the server mode supported by your installation
2. Set `CAREER_OPS_OPENCODE_RUN_ARGS` to the matching client flags
3. Run `bash batch/batch-runner.sh --parallel 4`
4. Confirm multiple clients connect successfully and outputs remain contract-compatible

## 7. Batch via SDK

1. Point `CAREER_OPS_OPENCODE_SDK_CMD` at your SDK worker
2. Run a batch worker through `CAREER_OPS_OPENCODE_MODE=sdk`
3. Confirm the JSON payload contract is sufficient for the worker

## 8. Integrity checks

1. Run `npm run verify`
2. Run `npm run sync-check`
3. Run `cd dashboard && go build -o /tmp/career-dashboard .`
4. Re-run `merge-tracker.mjs`, `normalize-statuses.mjs`, and `dedup-tracker.mjs` if batch outputs changed

## 9. Claude parity spot-check

1. Run one equivalent flow with `CAREER_OPS_AGENT_PROVIDER=claude`
2. Confirm downstream artifacts remain compatible with the same pipeline scripts
