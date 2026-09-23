"use strict";

/**
 * Asegura categorías ES/EN para el catálogo de viviendas (bases ya sembradas sin la 7ª categoría).
 * Los productos se agregan por seed en instalaciones nuevas o desde el panel admin.
 */
module.exports = {
  async up(qi) {
    await qi.sequelize.query(`
      INSERT INTO "W1_product_category" ("des_category", "language")
      SELECT 'Catálogo de Viviendas', 'ESPA'
      WHERE NOT EXISTS (
        SELECT 1 FROM "W1_product_category"
        WHERE "des_category" = 'Catálogo de Viviendas' AND "language" = 'ESPA'
      );
    `);
    await qi.sequelize.query(`
      INSERT INTO "W1_product_category" ("des_category", "language")
      SELECT 'Housing Catalog', 'ENGL'
      WHERE NOT EXISTS (
        SELECT 1 FROM "W1_product_category"
        WHERE "des_category" = 'Housing Catalog' AND "language" = 'ENGL'
      );
    `);
  },

  async down(qi) {
    await qi.sequelize.query(`
      DELETE FROM "W1_product_category" c
      WHERE (
        (c."des_category" = 'Catálogo de Viviendas' AND c."language" = 'ESPA')
        OR (c."des_category" = 'Housing Catalog' AND c."language" = 'ENGL')
      )
      AND NOT EXISTS (SELECT 1 FROM "W1_product" p WHERE p."id_category" = c."id_category");
    `);
  }
};
