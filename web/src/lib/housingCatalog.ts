import type { ApiLang, ProductCategory } from './api'

/** Colección “Destacados” (antes catálogo viviendas) — coincide con API / seed. */
export const FEATURED_CATALOG_CATEGORY: Record<ApiLang, string> = {
  ESPA: 'Novedades',
  ENGL: 'New in',
}

export function findFeaturedCatalogCategoryId(categories: ProductCategory[], lang: ApiLang): number | undefined {
  const want = FEATURED_CATALOG_CATEGORY[lang]
  return categories.find((c) => c.des_category === want)?.id_category
}

/** @deprecated use findFeaturedCatalogCategoryId */
export function findHousingCatalogCategoryId(categories: ProductCategory[], lang: ApiLang): number | undefined {
  return findFeaturedCatalogCategoryId(categories, lang)
}

/** @deprecated use FEATURED_CATALOG_CATEGORY */
export const HOUSING_CATALOG_CATEGORY = FEATURED_CATALOG_CATEGORY
