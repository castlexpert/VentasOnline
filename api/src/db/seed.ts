import "dotenv/config";
import bcrypt from "bcrypt";
import { sequelize } from "./sequelize.js";
import { initModels, ProductCategory, Product, Store, UserAdmin, Quoter } from "../models/index.js";

const SALT = 12;

/** Colecciones tipo retail (ES / EN). */
const CATEGORY_LABELS: { es: string; en: string }[] = [
  { es: "Mujer", en: "Women" },
  { es: "Hombre", en: "Men" },
  { es: "Niños", en: "Kids" },
  { es: "Accesorios", en: "Accessories" },
  { es: "Hogar", en: "Home" },
  { es: "Novedades", en: "New in" }
];

const AMOUNTS = ["89500", "124900", "45900", "189500", "67900", "210000", "34900", "99000"];

const STORES = [
  {
    name: "Tienda Online — Metro",
    address: "Avenida Central, San José, Costa Rica",
    phone: "+506 4000 1000",
    email: "ventas1@tiendaonline.demo"
  },
  {
    name: "Tienda Online — Escazú",
    address: "Multiplaza Escazú, San José",
    phone: "+506 4000 1001",
    email: "ventas2@tiendaonline.demo"
  },
  {
    name: "Tienda Online — Heredia",
    address: "Centro, Heredia",
    phone: "+506 4000 1002",
    email: "ventas3@tiendaonline.demo"
  },
  {
    name: "Tienda Online — Cartago",
    address: "Centro, Cartago",
    phone: "+506 4000 1003",
    email: "ventas4@tiendaonline.demo"
  }
];

function techSheet(productName: string, lang: "ESPA" | "ENGL") {
  if (lang === "ESPA") {
    return `Ficha — ${productName}. Consulte tallas y disponibilidad en tienda.`;
  }
  return `Sheet — ${productName}. Check sizes and availability in store.`;
}

async function seed() {
  initModels(sequelize);
  await sequelize.authenticate();

  const hash = await bcrypt.hash("concretera1234", SALT);
  await UserAdmin.upsert({
    user: "ADMIN",
    password: hash,
    name: "Administrador",
    apellido1: "Sistema",
    apellido2: null,
    phone: null,
    phone2: null,
    direccion: null,
    ind_tip_user: "LOCAL",
    ind_status: "ACTIVO"
  });

  const existingCats = await ProductCategory.count();
  if (existingCats > 0) {
    // eslint-disable-next-line no-console
    console.log("Seed skipped catalog (categories already exist). Admin upserted.");
    await sequelize.close();
    return;
  }

  const catIds: { ESPA: number; ENGL: number }[] = [];
  for (const c of CATEGORY_LABELS) {
    const rowEs = await ProductCategory.create({
      des_category: c.es,
      language: "ESPA"
    });
    const rowEn = await ProductCategory.create({
      des_category: c.en,
      language: "ENGL"
    });
    catIds.push({ ESPA: rowEs.id_category, ENGL: rowEn.id_category });
  }

  for (let ci = 0; ci < catIds.length; ci++) {
    const ids = catIds[ci]!;
    for (let i = 0; i < 8; i++) {
      const nEs = `Producto ${i + 1}`;
      const nEn = `Product ${i + 1}`;
      const descEs = "Artículo de catálogo genérico. Calidad premium.";
      const descEn = "Generic catalog item. Premium quality.";
      const amt = AMOUNTS[i];
      await Product.create({
        id_category: ids.ESPA,
        name_product: nEs,
        desc_product: descEs,
        det_product: techSheet(nEs, "ESPA"),
        amount: amt,
        language: "ESPA",
        img_path_name: null,
        pdf_path_name: null
      });
      await Product.create({
        id_category: ids.ENGL,
        name_product: nEn,
        desc_product: descEn,
        det_product: techSheet(nEn, "ENGL"),
        amount: amt,
        language: "ENGL",
        img_path_name: null,
        pdf_path_name: null
      });
    }
  }

  for (const pl of STORES) {
    const created = await Store.create({
      name: pl.name,
      address: pl.address,
      phone: pl.phone,
      email: pl.email,
      createdAt: new Date()
    });
    await Quoter.create({
      email_quoter: pl.email,
      id_store: created.id_store,
      name: "Ventas",
      apellido1: "Online",
      apellido2: null,
      phone: pl.phone,
      phone2: null,
      address: pl.address,
      cc_email: "hola@tiendaonline.demo"
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed completed.");
  await sequelize.close();
}

seed().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
