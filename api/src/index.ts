import "dotenv/config";
import { initModels } from "./models/index.js";
import { sequelize } from "./db/sequelize.js";
import { env } from "./env.js";
import { createApp } from "./app.js";
import { syncSitePageIndexFromDb } from "./siteIndexSync.js";

initModels(sequelize);

const app = createApp();

async function start() {
  await sequelize.authenticate();
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${env.PORT}`);
  });
  setTimeout(() => {
    syncSitePageIndexFromDb(sequelize).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn("[site-index] sync failed:", e?.message || e);
    });
  }, 1000);
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
