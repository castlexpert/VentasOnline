/**
 * Bootstrap from zero: create DB (if needed) → migrate → seed.
 * Usage: npm run db:setup -w api
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureDatabase } from "./ensureDatabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "../..");

function run(cmd: string, args: string[]) {
  // eslint-disable-next-line no-console
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: apiRoot,
    stdio: "inherit",
    shell: true,
    env: process.env
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("=== Venta Online — DB setup from zero ===");
  await ensureDatabase();
  run("npx", ["sequelize-cli", "db:migrate", "--config", "config/database.cjs"]);
  run("npx", ["tsx", "src/db/seed.ts"]);
  // eslint-disable-next-line no-console
  console.log("\nDB setup complete. Start API with: npm run dev -w api");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
