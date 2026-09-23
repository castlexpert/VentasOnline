"use strict";

const { QueryTypes } = require("sequelize");

/**
 * Reemplaza catálogo (categorías, productos, tiendas, cotizadores) por datos genéricos
 * de tienda online. Borra cotizaciones existentes. No borra usuarios admin ni clientes cita.
 */
module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;

    await sequelize.transaction(async (t) => {
      await sequelize.query(`DELETE FROM "W1_quote"`, { transaction: t });
      await sequelize.query(`DELETE FROM "W1_quoter"`, { transaction: t });
      await sequelize.query(`DELETE FROM "W1_product"`, { transaction: t });
      await sequelize.query(`DELETE FROM "W1_product_category"`, { transaction: t });
      await sequelize.query(`DELETE FROM "W1_store"`, { transaction: t });

      for (const seq of [
        `SELECT setval(pg_get_serial_sequence('"W1_product_category"', 'id_category'), 1, false)`,
        `SELECT setval(pg_get_serial_sequence('"W1_product"', 'id_product'), 1, false)`,
        `SELECT setval(pg_get_serial_sequence('"W1_store"', 'id_store'), 1, false)`
      ]) {
        await sequelize.query(seq, { transaction: t });
      }

      const stores = [
        ["Tienda Online — Metro", "Avenida Central, San José, Costa Rica", "+506 4000 1000", "ventas1@tiendaonline.demo"],
        ["Tienda Online — Escazú", "Multiplaza Escazú, San José", "+506 4000 1001", "ventas2@tiendaonline.demo"],
        ["Tienda Online — Heredia", "Centro, Heredia", "+506 4000 1002", "ventas3@tiendaonline.demo"],
        ["Tienda Online — Cartago", "Centro, Cartago", "+506 4000 1003", "ventas4@tiendaonline.demo"]
      ];

      for (const [name, address, phone, email] of stores) {
        const rows = await sequelize.query(
          `INSERT INTO "W1_store" ("name", "address", "phone", "email", "createdAt")
           VALUES ($1, $2, $3, $4, CURRENT_DATE) RETURNING id_store`,
          { bind: [name, address, phone, email], transaction: t, type: QueryTypes.SELECT }
        );
        const id_store = rows[0].id_store;
        await sequelize.query(
          `INSERT INTO "W1_quoter" ("email_quoter", "id_store", "name", "apellido1", "phone", "address", "cc_email")
           VALUES ($1, $2, 'Ventas', 'Online', $3, $4, 'hola@tiendaonline.demo')`,
          { bind: [email, id_store, phone, address], transaction: t }
        );
      }

      const catLabels = [
        ["Mujer", "Women"],
        ["Hombre", "Men"],
        ["Niños", "Kids"],
        ["Accesorios", "Accessories"],
        ["Hogar", "Home"],
        ["Novedades", "New in"]
      ];

      const amountsEspa = ["89500", "124900", "45900", "189500", "67900", "210000", "34900", "99000"];
      const amountsEng = ["89500", "124900", "45900", "189500", "67900", "210000", "34900", "99000"];

      for (const [es, en] of catLabels) {
        const rEs = await sequelize.query(
          `INSERT INTO "W1_product_category" ("des_category", "language") VALUES ($1, 'ESPA') RETURNING id_category`,
          { bind: [es], transaction: t, type: QueryTypes.SELECT }
        );
        const rEn = await sequelize.query(
          `INSERT INTO "W1_product_category" ("des_category", "language") VALUES ($1, 'ENGL') RETURNING id_category`,
          { bind: [en], transaction: t, type: QueryTypes.SELECT }
        );
        const idEs = rEs[0].id_category;
        const idEn = rEn[0].id_category;

        for (let i = 0; i < 8; i++) {
          const nEs = `Producto ${i + 1}`;
          const nEn = `Product ${i + 1}`;
          const descEs = "Artículo de catálogo genérico. Calidad premium.";
          const descEn = "Generic catalog item. Premium quality.";
          const detEs = `Ficha — ${nEs}. Consulte tallas y disponibilidad en tienda.`;
          const detEn = `Sheet — ${nEn}. Check sizes and availability in store.`;
          const amt = amountsEspa[i];
          await sequelize.query(
            `INSERT INTO "W1_product" ("id_category", "name_product", "desc_product", "det_product", "amount", "language", "img_path_name", "pdf_path_name")
             VALUES ($1, $2, $3, $4, $5, 'ESPA', NULL, NULL)`,
            { bind: [idEs, nEs, descEs, detEs, amt], transaction: t }
          );
          await sequelize.query(
            `INSERT INTO "W1_product" ("id_category", "name_product", "desc_product", "det_product", "amount", "language", "img_path_name", "pdf_path_name")
             VALUES ($1, $2, $3, $4, $5, 'ENGL', NULL, NULL)`,
            { bind: [idEn, nEn, descEn, detEn, amountsEng[i]], transaction: t }
          );
        }
      }
    });
  },

  async down() {
    // irreversible data migration
  }
};
