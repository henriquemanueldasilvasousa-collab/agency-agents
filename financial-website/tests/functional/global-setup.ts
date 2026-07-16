import { execSync, spawn, spawnSync, type ChildProcess } from "node:child_process";
import { writeFileSync, rmSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const PORT = 3211;
export const SERVER_INFO_FILE = path.join(ROOT, "tests/functional/.server-info.json");

function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status === 404) {
          resolve();
          return;
        }
      } catch {
        // server not ready yet
      }
      if (Date.now() > deadline) {
        reject(new Error(`Server did not become ready at ${url} within ${timeoutMs}ms`));
        return;
      }
      setTimeout(attempt, 300);
    };
    attempt();
  });
}

let serverProcess: ChildProcess | undefined;

function killWhateverIsOnPort(port: number) {
  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
  } catch {
    // No process was listening, or fuser isn't available — fine either way.
  }
}

export default async function setup() {
  killWhateverIsOnPort(PORT);

  console.log("[functional tests] Building app...");
  const build = spawnSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
  if (build.status !== 0) {
    throw new Error("next build failed; cannot run functional tests.");
  }

  console.log(`[functional tests] Starting server on port ${PORT}...`);
  const nextBin = path.join(ROOT, "node_modules/.bin/next");
  serverProcess = spawn(nextBin, ["start", "-p", String(PORT)], {
    cwd: ROOT,
    stdio: "pipe",
    env: { ...process.env, NODE_ENV: "production" },
    detached: true,
  });

  serverProcess.stdout?.on("data", (chunk) => process.stdout.write(`[server] ${chunk}`));
  serverProcess.stderr?.on("data", (chunk) => process.stderr.write(`[server:err] ${chunk}`));

  const baseUrl = `http://localhost:${PORT}`;
  await waitForServer(`${baseUrl}/`, 45000);
  writeFileSync(SERVER_INFO_FILE, JSON.stringify({ baseUrl }));
  console.log(`[functional tests] Server ready at ${baseUrl}`);

  return async function teardown() {
    if (serverProcess?.pid) {
      try {
        // Negative pid signals the whole detached process group, killing
        // the "next start" wrapper along with the actual server process.
        process.kill(-serverProcess.pid, "SIGKILL");
      } catch {
        serverProcess.kill("SIGKILL");
      }
    }
    // Belt-and-suspenders: some Next.js versions re-exec into a process
    // outside the tracked group, so also reap by port directly.
    killWhateverIsOnPort(PORT);
    try {
      rmSync(SERVER_INFO_FILE, { force: true });
    } catch {
      // ignore
    }
  };
}
