import type { Sequelize } from "sequelize";
import { Product, ProductCategory, Store } from "./models/index.js";
import { embedQueryText, ensureSiteIndexSchema, upsertSitePage } from "./siteIndex.js";

function summarize(text: string, max = 240) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** Builds/updates the RAG site index. Returns false if pgvector is not available on PostgreSQL. */
export async function syncSitePageIndexFromDb(sq: Sequelize): Promise<boolean> {
  const schemaOk = await ensureSiteIndexSchema(sq);
  if (!schemaOk) return false;

  const [stores, categoriesEspa, categoriesEn, productsEspa, productsEn] = await Promise.all([
    Store.findAll({ order: [["name", "ASC"]] }),
    ProductCategory.findAll({ where: { language: "ESPA" }, order: [["id_category", "ASC"]] }),
    ProductCategory.findAll({ where: { language: "ENGL" }, order: [["id_category", "ASC"]] }),
    Product.findAll({
      where: { language: "ESPA" },
      include: [{ model: ProductCategory, as: "category" }],
      order: [["id_product", "ASC"]]
    }),
    Product.findAll({
      where: { language: "ENGL" },
      include: [{ model: ProductCategory, as: "category" }],
      order: [["id_product", "ASC"]]
    })
  ]);

  /** Seed crea parejas consecutivas ESPA/ENGL (id N español, id N+1 inglés). */
  const enByEspaProductId = new Map<number, (typeof productsEn)[0]>();
  for (const row of productsEn) {
    enByEspaProductId.set(row.id_product - 1, row);
  }

  const docs: Array<{
    url: string;
    titulo_es: string;
    descripcion_es: string;
    titulo_en: string;
    descripcion_en: string;
    secciones: any[];
    embeddingText: string;
  }> = [];

  docs.push({
    url: "/",
    titulo_es: "Inicio",
    descripcion_es: "Tienda en línea: moda y hogar, precios en colones y cotización.",
    titulo_en: "Home",
    descripcion_en: "Online store: fashion and home, prices in colones, quotes.",
    secciones: [
      {
        titulo_es: "Productos",
        descripcion_es: "Catálogo por colección.",
        titulo_en: "Products",
        descripcion_en: "Catalog by collection."
      },
      {
        titulo_es: "Categorías",
        descripcion_es: "Comprar por mujer, hombre, niños, accesorios y hogar.",
        titulo_en: "Categories",
        descripcion_en: "Shop women, men, kids, accessories and home."
      },
      {
        titulo_es: "Cotización",
        descripcion_es: "Carrito de cotización y tienda.",
        titulo_en: "Quote",
        descripcion_en: "Quote cart and store pickup."
      }
    ],
    embeddingText:
      "Inicio Tienda Online. Colecciones, Destacados, Ubicaciones, Cotización, precios en colones."
  });

  docs.push({
    url: "/productos",
    titulo_es: "Productos",
    descripcion_es: `Categorías: ${categoriesEspa.map((c) => c.des_category).join(", ")}`,
    titulo_en: "Products",
    descripcion_en: `Categories: ${categoriesEn.map((c) => c.des_category).join(", ")}`,
    secciones: categoriesEspa.map((c, i) => ({
      titulo_es: c.des_category,
      descripcion_es: "Categoría de productos",
      titulo_en: categoriesEn[i]?.des_category || c.des_category,
      descripcion_en: "Product category"
    })),
    embeddingText: `Productos Tienda Online. Colecciones: ${categoriesEspa.map((c) => c.des_category).join(", ")}.`
  });

  docs.push({
    url: "/sistemas",
    titulo_es: "Comprar por categoría",
    descripcion_es: "Acceso rápido a mujer, hombre, niños y hogar.",
    titulo_en: "Shop by category",
    descripcion_en: "Quick links to women, men, kids and home.",
    secciones: [
      {
        titulo_es: "Mujer y Hombre",
        descripcion_es: "Enlaces a colecciones",
        titulo_en: "Women & Men",
        descripcion_en: "Collection links"
      },
      {
        titulo_es: "Niños y Hogar",
        descripcion_es: "Enlaces a colecciones",
        titulo_en: "Kids & Home",
        descripcion_en: "Collection links"
      }
    ],
    embeddingText:
      "Tienda Online. Comprar por categoría: mujer, hombre, niños, hogar, accesorios, novedades."
  });

  docs.push({
    url: "/viviendas",
    titulo_es: "Destacados",
    descripcion_es: "Piezas destacadas de la colección Novedades.",
    titulo_en: "Featured",
    descripcion_en: "Highlighted items from New in.",
    secciones: [],
    embeddingText: "Tienda Online. Destacados, colección Novedades."
  });

  docs.push({
    url: "/contacto",
    titulo_es: "Ubicaciones y contacto",
    descripcion_es: `Tiendas: ${stores.map((p) => p.name).join(", ")}`,
    titulo_en: "Locations and contact",
    descripcion_en: `Stores: ${stores.map((p) => p.name).join(", ")}`,
    secciones: stores.map((p) => ({
      titulo_es: p.name,
      descripcion_es: p.address,
      titulo_en: p.name,
      descripcion_en: p.address
    })),
    embeddingText: `Contacto Tienda Online. Tiendas: ${stores.map((p) => `${p.name} ${p.address} ${p.phone} ${p.email}`).join(" | ")}.`
  });

  docs.push({
    url: "/cotizar",
    titulo_es: "Cotización",
    descripcion_es: "Carrito de cotización y envío con sesión de usuario.",
    titulo_en: "Quote",
    descripcion_en: "Quote cart and authenticated submit.",
    secciones: [],
    embeddingText: "Tienda Online. Cotización por tienda y productos del carrito."
  });

  for (const prod of productsEspa) {
    const en = enByEspaProductId.get(prod.id_product);
    const cat = prod.category as ProductCategory | undefined;
    const desc = prod.desc_product || "";
    const det = prod.det_product || "";
    const priceNote = prod.amount != null ? ` Precio referencia: ₡${prod.amount}.` : "";
    docs.push({
      url: `/productos/${prod.id_product}`,
      titulo_es: prod.name_product || "Producto",
      descripcion_es: summarize(desc, 260),
      titulo_en: en?.name_product || summarize(desc, 120),
      descripcion_en: summarize(en?.desc_product || desc, 260),
      secciones: [
        {
          titulo_es: "Categoría",
          descripcion_es: cat?.des_category || "",
          titulo_en: "Category",
          descripcion_en: en ? (en.category as ProductCategory)?.des_category || "" : ""
        }
      ],
      embeddingText: `${prod.name_product}\nCategoría: ${cat?.des_category || ""}\n${desc}\n${det}${priceNote}`.slice(0, 12000)
    });
  }

  for (const d of docs) {
    let embedding = null;
    try {
      embedding = await embedQueryText(d.embeddingText);
    } catch {
      embedding = null;
    }
    // eslint-disable-next-line no-await-in-loop
    await upsertSitePage(sq, {
      url: d.url,
      titulo_es: d.titulo_es,
      descripcion_es: d.descripcion_es,
      titulo_en: d.titulo_en,
      descripcion_en: d.descripcion_en,
      secciones: d.secciones,
      embedding
    });
  }

  return true;
}
