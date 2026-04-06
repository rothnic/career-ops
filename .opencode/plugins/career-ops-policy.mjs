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

function containsDotEnvPath(text) {
  return /(^|[\\/"'\s])\.env(?:\.[a-z0-9_-]+)*(?=$|[\\/"'\s])/i.test(text);
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

function processExists(pid) {
  if (!pid || !/^\d+$/.test(pid)) {
    return false;
  }

  try {
    process.kill(Number(pid), 0);
    return true;
  } catch {
    return false;
  }
}

async function acquirePlaywrightLockSafely() {
  try {
    await acquirePlaywrightLock();
  } catch (error) {
    if (error?.code !== "EEXIST") {
      throw error;
    }

    const holder = await currentPlaywrightLockHolder();
    if (!processExists(holder)) {
      await releasePlaywrightLock();
      await acquirePlaywrightLock();
      return;
    }

    throw error;
  }
}

async function releasePlaywrightLock() {
  await fs.rm(PLAYWRIGHT_LOCK, { force: true });
}

export const CareerOpsPolicy = async () => ({
  "tool.execute.before": async (input, output) => {
    const text = argsText(input, output);

    if (containsDotEnvPath(text)) {
      throw new Error("Career-Ops policy blocks access to .env files.");
    }

    if (isPlaywrightInvocation(input, output)) {
      try {
        await acquirePlaywrightLockSafely();
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
