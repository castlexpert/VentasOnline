"use strict";

/** Renombra plantas → tiendas (W1_plant → W1_store, id_plant → id_store). */
module.exports = {
  async up(qi) {
    const { sequelize } = qi;

    const [[plantTable]] = await sequelize.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = 'W1_plant'`
    );
    if (!plantTable) return;

    await sequelize.query(`ALTER TABLE "W1_plant" RENAME TO "W1_store"`);
    await sequelize.query(`ALTER TABLE "W1_store" RENAME COLUMN "id_plant" TO "id_store"`);

    await sequelize.query(`ALTER TABLE "W1_quoter" RENAME COLUMN "id_plant" TO "id_store"`);
    await sequelize.query(`ALTER TABLE "W1_quote" RENAME COLUMN "id_plant" TO "id_store"`);

    await sequelize.query(
      `ALTER INDEX IF EXISTS idx_w1_quote_plant RENAME TO idx_w1_quote_store`
    );
  },

  async down(qi) {
    const { sequelize } = qi;

    const [[storeTable]] = await sequelize.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = 'W1_store'`
    );
    if (!storeTable) return;

    await sequelize.query(
      `ALTER INDEX IF EXISTS idx_w1_quote_store RENAME TO idx_w1_quote_plant`
    );
    await sequelize.query(`ALTER TABLE "W1_quote" RENAME COLUMN "id_store" TO "id_plant"`);
    await sequelize.query(`ALTER TABLE "W1_quoter" RENAME COLUMN "id_store" TO "id_plant"`);
    await sequelize.query(`ALTER TABLE "W1_store" RENAME COLUMN "id_store" TO "id_plant"`);
    await sequelize.query(`ALTER TABLE "W1_store" RENAME TO "W1_plant"`);
  }
};
