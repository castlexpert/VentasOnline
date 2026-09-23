import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

/** Creates the Postgres database named in DATABASE_URL if it does not exist. */
export async function ensureDatabase(): Promise<string> {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is required");

  const url = new URL(raw);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, "")).trim();
  if (!dbName || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(dbName)) {
    throw new Error(`Invalid database name in DATABASE_URL: "${dbName}"`);
  }

  const adminUrl = new URL(raw);
  adminUrl.pathname = "/postgres";

  const client = new pg.Client({ connectionString: adminUrl.toString() });
  await client.connect();
  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      // eslint-disable-next-line no-console
      console.log(`Database "${dbName}" created.`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Database "${dbName}" already exists.`);
    }
  } finally {
    await client.end();
  }

  return dbName;
}

const isMain =
  !!process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isMain) {
  ensureDatabase().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
