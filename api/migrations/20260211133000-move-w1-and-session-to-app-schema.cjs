"use strict";

/** @param {import('sequelize').QueryInterface} qi */

function appSchema() {
  const s = process.env.DB_SCHEMA || "WVENTA_ONLINE";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) {
    throw new Error(`Invalid DB_SCHEMA for migration: ${s}`);
  }
  return s;
}

const MOVE_ORDER_UP = [
  "W1_quote",
  "W1_quoter",
  "W1_product",
  "W1_user_quote",
  "W1_user_admin",
  "W1_product_category",
  "W1_plant",
  "session"
];

const MOVE_ORDER_DOWN = [...MOVE_ORDER_UP].reverse();

async function moveIfPresent(qi, fromSchema, toSchema, tableName) {
  const [rows] = await qi.sequelize.query(
    `SELECT 1 AS x
     FROM information_schema.tables
     WHERE table_schema = $1 AND table_name = $2
     LIMIT 1`,
    { bind: [fromSchema, tableName] }
  );
  if (!rows || !rows.length) return;
  await qi.sequelize.query(`ALTER TABLE "${fromSchema}"."${tableName}" SET SCHEMA "${toSchema}"`);
}

module.exports = {
  async up(qi) {
    const schema = appSchema();
    await qi.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schema}";`);
    for (const t of MOVE_ORDER_UP) {
      await moveIfPresent(qi, "public", schema, t);
    }
  },

  async down(qi) {
    const schema = appSchema();
    for (const t of MOVE_ORDER_DOWN) {
      await moveIfPresent(qi, schema, "public", t);
    }
  }
};
