import "dotenv/config";
import { initModels } from "../models/index.js";
import { sequelize } from "../db/sequelize.js";
import { syncSitePageIndexFromDb } from "../siteIndexSync.js";

async function main() {
  initModels(sequelize);
  await sequelize.authenticate();
  try {
    const synced = await syncSitePageIndexFromDb(sequelize);
    if (!synced) {
      // eslint-disable-next-line no-console
      console.warn("[site-index] sync skipped (install pgvector on PostgreSQL to enable RAG index)");
      return;
    }
    // eslint-disable-next-line no-console
    console.log("[site-index] sync completed");
  } finally {
    await sequelize.close();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("[site-index] sync failed:", e?.message || e);
  process.exit(1);
});

