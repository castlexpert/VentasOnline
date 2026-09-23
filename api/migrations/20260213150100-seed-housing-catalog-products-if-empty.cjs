"use strict";

/**
 * Si la categoría "Catálogo de Viviendas" / "Housing Catalog" no tiene productos,
 * inserta los mismos modelos demo que el seed (bases actualizadas sin re-sembrar todo).
 */
const ES = [
  ["Casa modelo Palmar 96 m²", "Dos dormitorios, sala-comedor, cocina lineal y patio de servicio."],
  ["Casa modelo Brisa 110 m²", "Tres dormitorios, dos baños, garaje techado para un vehículo."],
  ["Casa modelo Roble 125 m²", "Distribución en L, dormitorio principal con vestidor."],
  ["Dúplex modelo Cedro 140 m²", "Dos niveles, escalera interior, balcón frontal."],
  ["Casa modelo Horizonte 135 m²", "Sala familiar, cuarto de huéspedes y lavandería cerrada."]
];

const EN = [
  ["Palmar model home 96 m²", "Two bedrooms, living-dining, galley kitchen and laundry patio."],
  ["Brisa model home 110 m²", "Three bedrooms, two bathrooms, single-car covered garage."],
  ["Oak model home 125 m²", "L-shaped layout, primary suite with walk-in closet."],
  ["Cedar duplex model 140 m²", "Two levels, interior stair, front balcony."],
  ["Horizon model home 135 m²", "Family room, guest bedroom and enclosed laundry."]
];

module.exports = {
  async up(qi) {
    const [esRows] = await qi.sequelize.query(
      `SELECT "id_category" AS id FROM "W1_product_category"
       WHERE "des_category" = 'Catálogo de Viviendas' AND "language" = 'ESPA' LIMIT 1`
    );
    const [enRows] = await qi.sequelize.query(
      `SELECT "id_category" AS id FROM "W1_product_category"
       WHERE "des_category" = 'Housing Catalog' AND "language" = 'ENGL' LIMIT 1`
    );
    const esCat = esRows[0];
    const enCat = enRows[0];
    if (!esCat?.id || !enCat?.id) return;

    const [cntRows] = await qi.sequelize.query(
      `SELECT COUNT(*)::int AS n FROM "W1_product" WHERE "id_category" = $1`,
      { bind: [esCat.id] }
    );
    const cntEs = Number(cntRows[0]?.n ?? 0);
    if (cntEs > 0) return;

    const techEs = (name) => `Ficha técnica — ${name}. Consultar en planta.`;
    const techEn = (name) => `Technical sheet — ${name}. Ask your plant for details.`;

    for (let i = 0; i < ES.length; i++) {
      const [nameEs, descEs] = ES[i];
      const [nameEn, descEn] = EN[i];
      await qi.sequelize.query(
        `INSERT INTO "W1_product" ("id_category","name_product","desc_product","det_product","amount","language","img_path_name","pdf_path_name")
         VALUES ($1,$2,$3,$4,NULL,'ESPA',NULL,NULL)`,
        { bind: [esCat.id, nameEs, descEs, techEs(nameEs)] }
      );
      await qi.sequelize.query(
        `INSERT INTO "W1_product" ("id_category","name_product","desc_product","det_product","amount","language","img_path_name","pdf_path_name")
         VALUES ($1,$2,$3,$4,NULL,'ENGL',NULL,NULL)`,
        { bind: [enCat.id, nameEn, descEn, techEn(nameEn)] }
      );
    }
  },

  async down(qi) {
    const names = [...ES.map((r) => r[0]), ...EN.map((r) => r[0])];
    for (const n of names) {
      await qi.sequelize.query(`DELETE FROM "W1_product" WHERE "name_product" = $1`, { bind: [n] });
    }
  }
};
