import { Sequelize } from "sequelize";
import { env } from "../env.js";
import { sqlSetSearchPath } from "./pgSchema.js";

const searchPathSql = sqlSetSearchPath(env.DB_SCHEMA);

export const sequelize = new Sequelize(env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
  dialectOptions: {
    ssl: env.DATABASE_SSL ? { require: true, rejectUnauthorized: false } : false
  },
  define: {
    freezeTableName: true,
    underscored: false
  },
  hooks: {
    afterConnect: async (conn: { query: (sql: string) => Promise<unknown> }) => {
      await conn.query(searchPathSql);
    }
  }
});
