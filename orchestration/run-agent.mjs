#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { spawn, spawnSync } from "node:child_process";

const EXIT_CODE_SIGNAL_TERMINATED = 128;
const EXIT_CODE_UNKNOWN_TERMINATION = 1;

function getArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasArg(name) {
  return process.argv.includes(name);
}

async function readSystemPrompt() {
  const file = getArg("--system-prompt-file");
  if (!file) return "";
  return readFile(file, "utf8");
}

function requiredArg(name) {
  const value = getArg(name);
  if (!value) {
    throw new Error(`Missing required argument: ${name}`);
  }
  return value;
}

function shellWords(input = "") {
  // Supports simple shell-style quoted arguments for CAREER_OPS_OPENCODE_RUN_ARGS.
  // For complex escaping, prefer an SDK worker via CAREER_OPS_OPENCODE_SDK_CMD.
  const matches = input.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  return matches.map((part) => part.replace(/^['"]|['"]$/g, ""));
}

function commandExists(command) {
  const result = spawnSync("which", [command], { stdio: "ignore" });
  return result.status === 0;
}

function resolveProvider(requestedProvider) {
  if (requestedProvider && requestedProvider !== "auto") {
    return requestedProvider;
  }

  const opencodeAvailable =
    process.env.CAREER_OPS_OPENCODE_MODE === "sdk" ||
    Boolean(process.env.CAREER_OPS_OPENCODE_SDK_CMD) ||
    commandExists(process.env.CAREER_OPS_OPENCODE_BIN || "opencode");
  const claudeAvailable = commandExists(process.env.CAREER_OPS_CLAUDE_BIN || "claude");

  if (opencodeAvailable && claudeAvailable) {
    throw new Error(
      "Both OpenCode and Claude Code are available. No default is chosen in mixed environments; set CAREER_OPS_AGENT_PROVIDER=opencode or claude."
    );
  }
  if (opencodeAvailable) return "opencode";
  if (claudeAvailable) return "claude";

  throw new Error(
    "No supported coding agent was detected. Install OpenCode or Claude Code, or set the relevant environment variables."
  );
}

function spawnAndPipe(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
      ...options,
    });

    if (options.stdinText) {
      child.stdin.write(options.stdinText);
    }
    child.stdin.end();

    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("close", (code, signal) => {
      if (code !== null) {
        resolve(code);
        return;
      }

      if (signal) {
        resolve(EXIT_CODE_SIGNAL_TERMINATED);
        return;
      }

      // This should be unreachable in normal child-process behavior.
      // Treat it as a generic launcher failure instead of silently succeeding.
      resolve(EXIT_CODE_UNKNOWN_TERMINATION);
    });
  });
}

async function runClaude(prompt, systemPromptFile) {
  const bin = process.env.CAREER_OPS_CLAUDE_BIN || "claude";
  const args = ["-p", "--dangerously-skip-permissions"];

  if (systemPromptFile) {
    args.push("--append-system-prompt-file", systemPromptFile);
  }

  args.push(prompt);
  return spawnAndPipe(bin, args);
}

async function runOpenCodeCli(prompt, systemPrompt) {
  const bin = process.env.CAREER_OPS_OPENCODE_BIN || "opencode";
  const runArgs = shellWords(process.env.CAREER_OPS_OPENCODE_RUN_ARGS);
  // Keep this prompt merge format aligned with docs/ORCHESTRATION.md.
  // OpenCode CLI mode receives one combined prompt consisting of the resolved
  // system prompt, a separator, and a labeled user request block.
  const combinedPrompt = systemPrompt
    ? `${systemPrompt}\n\n---\n\nUser request:\n${prompt}`
    : prompt;

  return spawnAndPipe(bin, ["run", ...runArgs, combinedPrompt]);
}

async function runOpenCodeSdk(payload) {
  const sdkCommand = process.env.CAREER_OPS_OPENCODE_SDK_CMD;

  if (!sdkCommand) {
    throw new Error(
      "CAREER_OPS_OPENCODE_SDK_CMD is required when CAREER_OPS_OPENCODE_MODE=sdk"
    );
  }

  const parts = sdkCommand.split(" ").filter(Boolean);
  const [command, ...args] = parts;

  return spawnAndPipe(command, args, {
    stdinText: `${JSON.stringify(payload)}\n`,
  });
}

async function main() {
  if (hasArg("--help")) {
    process.stdout.write(
      [
        "Usage: node orchestration/run-agent.mjs --prompt <text> [--system-prompt-file <path>] [--provider auto|opencode|claude]",
        "",
        "Environment:",
        "  CAREER_OPS_AGENT_PROVIDER       Default provider (auto by default)",
        "  CAREER_OPS_OPENCODE_MODE        opencode backend: cli or sdk",
        "  CAREER_OPS_OPENCODE_BIN         Override opencode executable",
        "  CAREER_OPS_OPENCODE_RUN_ARGS    Extra OpenCode client/provider/server flags",
        "  CAREER_OPS_OPENCODE_SDK_CMD     External SDK worker command",
        "  CAREER_OPS_CLAUDE_BIN           Override claude executable",
        "",
      ].join("\n")
    );
    process.exit(0);
  }

  const provider = resolveProvider(
    getArg("--provider") || process.env.CAREER_OPS_AGENT_PROVIDER || "auto"
  );
  const prompt = requiredArg("--prompt");
  const systemPromptFile = getArg("--system-prompt-file");
  const systemPrompt = await readSystemPrompt();

  let exitCode;

  if (provider === "claude") {
    exitCode = await runClaude(prompt, systemPromptFile);
  } else if (provider === "opencode") {
    const mode = process.env.CAREER_OPS_OPENCODE_MODE || "cli";
    if (mode === "sdk") {
      exitCode = await runOpenCodeSdk({
        prompt,
        systemPrompt,
      });
    } else {
      exitCode = await runOpenCodeCli(prompt, systemPrompt);
    }
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  process.exit(exitCode);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
