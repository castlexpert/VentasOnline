"use strict";

/**
 * Mueve a DB_SCHEMA (p. ej. WVENTA_ONLINE) todo lo que siga en `public` y sea objeto de usuario:
 * tablas (incl. particionadas), vistas, materialized views, secuencias sueltas, tipos ENUM.
 * No mueve objetos miembro de extensiones (pgvector, etc.) ni catálogos del sistema.
 *
 * @param {import('sequelize').QueryInterface} qi
 */

function appSchema() {
  const s = process.env.DB_SCHEMA || "WVENTA_ONLINE";
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(s)) {
    throw new Error(`Invalid DB_SCHEMA for migration: ${s}`);
  }
  return s;
}

/** @param {import('sequelize').Sequelize} sequelize */
function extMemberNotExists(alias) {
  return `NOT EXISTS (
    SELECT 1
    FROM pg_depend d
    JOIN pg_extension e ON d.refobjid = e.oid
    WHERE d.objid = ${alias} AND d.deptype = 'e'
  )`;
}

/**
 * @param {import('sequelize').QueryInterface} qi
 * @param {string} fromSchema
 * @param {string} toSchema
 * @param {string} relkindSql  fragment e.g. "c.relkind IN ('r','p')"
 * @param {'TABLE'|'VIEW'|'MATERIALIZED VIEW'|'SEQUENCE'} alterKind
 */
async function movePgClassLoop(qi, fromSchema, toSchema, relkindSql, alterKind) {
  let rounds = 0;
  const maxRounds = 200;
  while (rounds < maxRounds) {
    rounds += 1;
    const [rows] = await qi.sequelize.query(
      `SELECT c.relname::text AS name
       FROM pg_class c
       JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = $1
         AND (${relkindSql})
         AND NOT c.relispartition
         AND ${extMemberNotExists("c.oid")}
       ORDER BY c.relname`,
      { bind: [fromSchema] }
    );
    if (!rows || !rows.length) return;
    let progressed = false;
    for (const { name } of rows) {
      try {
        let sql;
        if (alterKind === "TABLE") {
          sql = `ALTER TABLE "${fromSchema}"."${name}" SET SCHEMA "${toSchema}"`;
        } else if (alterKind === "VIEW") {
          sql = `ALTER VIEW "${fromSchema}"."${name}" SET SCHEMA "${toSchema}"`;
        } else if (alterKind === "MATERIALIZED VIEW") {
          sql = `ALTER MATERIALIZED VIEW "${fromSchema}"."${name}" SET SCHEMA "${toSchema}"`;
        } else {
          sql = `ALTER SEQUENCE "${fromSchema}"."${name}" SET SCHEMA "${toSchema}"`;
        }
        await qi.sequelize.query(sql);
        progressed = true;
      } catch {
        /* FK u otro orden: reintento en siguiente ronda */
      }
    }
    if (!progressed) return;
  }
}

/** @param {import('sequelize').QueryInterface} qi */
async function moveEnumTypesLoop(qi, fromSchema, toSchema) {
  let rounds = 0;
  const maxRounds = 50;
  while (rounds < maxRounds) {
    rounds += 1;
    const [rows] = await qi.sequelize.query(
      `SELECT t.typname::text AS name
       FROM pg_type t
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = $1
         AND t.typtype = 'e'
         AND ${extMemberNotExists("t.oid")}
       ORDER BY t.typname`,
      { bind: [fromSchema] }
    );
    if (!rows || !rows.length) return;
    let progressed = false;
    for (const { name } of rows) {
      try {
        await qi.sequelize.query(`ALTER TYPE "${fromSchema}"."${name}" SET SCHEMA "${toSchema}"`);
        progressed = true;
      } catch {
        /* dependencia entre tipos */
      }
    }
    if (!progressed) return;
  }
}

/** @param {import('sequelize').QueryInterface} qi */
async function logRemaining(qi, schemaName, label) {
  const [tables] = await qi.sequelize.query(
    `SELECT c.relname::text AS name, c.relkind::text AS kind
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = $1
       AND c.relkind IN ('r','p','v','m','S')
       AND NOT c.relispartition
       AND ${extMemberNotExists("c.oid")}
     ORDER BY c.relname`,
    { bind: [schemaName] }
  );
  if (tables && tables.length) {
    // eslint-disable-next-line no-console
    console.warn(`[migration] ${label} ${schemaName}: ${tables.length} relación(es):`, tables.map((t) => `${t.name}(${t.kind})`).join(", "));
  }
  const [enums] = await qi.sequelize.query(
    `SELECT t.typname::text AS name
     FROM pg_type t
     JOIN pg_namespace n ON n.oid = t.typnamespace
     WHERE n.nspname = $1
       AND t.typtype = 'e'
       AND ${extMemberNotExists("t.oid")}
     ORDER BY t.typname`,
    { bind: [schemaName] }
  );
  if (enums && enums.length) {
    // eslint-disable-next-line no-console
    console.warn(`[migration] ${label} ${schemaName}: ENUM(s) sin mover:`, enums.map((e) => e.name).join(", "));
  }
}

module.exports = {
  async up(qi) {
    const to = appSchema();
    await qi.sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${to}";`);

    // Orden recomendado: tablas → matviews → vistas → secuencias → ENUMs
    await movePgClassLoop(qi, "public", to, `c.relkind IN ('r', 'p')`, "TABLE");
    await movePgClassLoop(qi, "public", to, `c.relkind = 'm'`, "MATERIALIZED VIEW");
    await movePgClassLoop(qi, "public", to, `c.relkind = 'v'`, "VIEW");
    await movePgClassLoop(qi, "public", to, `c.relkind = 'S'`, "SEQUENCE");
    await moveEnumTypesLoop(qi, "public", to);

    await logRemaining(qi, "public", "Quedan en");
  },

  async down(qi) {
    const from = appSchema();
    // Invertir: ENUMs → secuencias → vistas → matviews → tablas (reintentos por FK)
    await moveEnumTypesLoop(qi, from, "public");
    await movePgClassLoop(qi, from, "public", `c.relkind = 'S'`, "SEQUENCE");
    await movePgClassLoop(qi, from, "public", `c.relkind = 'v'`, "VIEW");
    await movePgClassLoop(qi, from, "public", `c.relkind = 'm'`, "MATERIALIZED VIEW");
    await movePgClassLoop(qi, from, "public", `c.relkind IN ('r', 'p')`, "TABLE");

    await logRemaining(qi, from, "Tras down, quedan en");
  }
};
