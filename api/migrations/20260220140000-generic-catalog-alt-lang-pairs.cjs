"use strict";

const { QueryTypes } = require("sequelize");

/** Corrige el orden de inserción ES/EN (emparejado como en seed) para el índice RAG del sitio. */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.transaction(async (t) => {
      await sequelize.query(`DELETE FROM "W1_quote"`, { transaction: t });
      await sequelize.query(`DELETE FROM "W1_product"`, { transaction: t });
      await sequelize.query(`SELECT setval(pg_get_serial_sequence('"W1_product"', 'id_product'), 1, false)`, {
        transaction: t
      });

      const español = await sequelize.query(
        `SELECT "id_category" FROM "W1_product_category" WHERE "language" = 'ESPA' ORDER BY "id_category" ASC`,
        { transaction: t, type: QueryTypes.SELECT }
      );
      const english = await sequelize.query(
        `SELECT "id_category" FROM "W1_product_category" WHERE "language" = 'ENGL' ORDER BY "id_category" ASC`,
        { transaction: t, type: QueryTypes.SELECT }
      );

      const amountsEs = ["89500", "124900", "45900", "189500", "67900", "210000", "34900", "99000"];

      const n = Math.min(español.length, english.length);
      for (let c = 0; c < n; c++) {
        const idEs = español[c].id_category;
        const idEn = english[c].id_category;

        for (let i = 0; i < 8; i++) {
          const nEs = `Producto ${i + 1}`;
          const nEn = `Product ${i + 1}`;
          await sequelize.query(
            `INSERT INTO "W1_product" ("id_category", "name_product", "desc_product", "det_product", "amount", "language", "img_path_name", "pdf_path_name")
             VALUES ($1, $2, 'Artículo de catálogo genérico. Calidad premium.', $3, $4, 'ESPA', NULL, NULL)`,
            { bind: [idEs, nEs, `Ficha — ${nEs}. Consulte tallas y disponibilidad en tienda.`, amountsEs[i]], transaction: t }
          );
          await sequelize.query(
            `INSERT INTO "W1_product" ("id_category", "name_product", "desc_product", "det_product", "amount", "language", "img_path_name", "pdf_path_name")
             VALUES ($1, $2, 'Generic catalog item. Premium quality.', $3, $4, 'ENGL', NULL, NULL)`,
            {
              bind: [idEn, nEn, `Sheet — ${nEn}. Check sizes and availability in store.`, amountsEs[i]],
              transaction: t
            }
          );
        }
      }
    });
  },

  async down() {}
};
