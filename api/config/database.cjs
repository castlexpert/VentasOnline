/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();

const schema = /^[A-Za-z_][A-Za-z0-9_]*$/.test(process.env.DB_SCHEMA || "")
  ? process.env.DB_SCHEMA
  : "WVENTA_ONLINE";

function searchPathHooks() {
  return {
    hooks: {
      afterConnect: async (conn) => {
        await conn.query(`SET search_path TO "${schema}", public`);
      }
    }
  };
}

/** Sequelize CLI (migrations/seeders) */
module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
    ...searchPathHooks()
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: process.env.DATABASE_SSL === "true" ? { require: true, rejectUnauthorized: false } : false
    },
    ...searchPathHooks()
  }
};
