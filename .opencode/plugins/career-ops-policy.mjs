import { promises as fs } from "node:fs";

const PLAYWRIGHT_LOCK =
  process.env.CAREER_OPS_PLAYWRIGHT_LOCK ||
  "/tmp/career-ops-opencode-playwright.lock";

function argsText(input, output) {
  return JSON.stringify({
    inputArgs: input?.args ?? {},
    outputArgs: output?.args ?? {},
  }).toLowerCase();
}

function isPlaywrightInvocation(input, output) {
  const text = argsText(input, output);
  return (
    text.includes("playwright") ||
    text.includes("browser_navigate") ||
    text.includes("browser_snapshot") ||
    text.includes("@playwright")
  );
}

async function acquirePlaywrightLock() {
  await fs.writeFile(PLAYWRIGHT_LOCK, `${process.pid}`, { flag: "wx" });
}

async function currentPlaywrightLockHolder() {
  try {
    return (await fs.readFile(PLAYWRIGHT_LOCK, "utf8")).trim();
  } catch {
    return "unknown";
  }
}

async function releasePlaywrightLock() {
  await fs.rm(PLAYWRIGHT_LOCK, { force: true });
}

export const CareerOpsPolicy = async () => ({
  "tool.execute.before": async (input, output) => {
    const text = argsText(input, output);

    if (text.includes(".env")) {
      throw new Error("Career-Ops policy blocks access to .env files.");
    }

    if (isPlaywrightInvocation(input, output)) {
      try {
        await acquirePlaywrightLock();
      } catch {
        const holder = await currentPlaywrightLockHolder();
        throw new Error(
          `Career-Ops serializes Playwright access. Process ${holder} currently holds the browser lock.`
        );
      }
    }
  },
  "tool.execute.after": async (input, output) => {
    if (isPlaywrightInvocation(input, output)) {
      await releasePlaywrightLock();
    }
  },
});
