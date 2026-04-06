import { promises as fs } from "node:fs";
import path from "node:path";

const LOG_DIR =
  process.env.CAREER_OPS_OPENCODE_LOG_DIR ||
  path.join(process.cwd(), ".opencode", "logs");
const LOG_FILE = path.join(LOG_DIR, "tool-events.ndjson");

async function append(entry) {
  await fs.mkdir(LOG_DIR, { recursive: true });
  await fs.appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`);
}

export const CareerOpsTelemetry = async () => ({
  "tool.execute.after": async (input, output) => {
    try {
      await append({
        ts: new Date().toISOString(),
        tool: input?.tool ?? "unknown",
        args: input?.args ?? {},
        result: output?.result ?? null,
      });
    } catch {
      // Telemetry must never block tool execution.
    }
  },
});
