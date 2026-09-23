import type { ApiLang, ProductCategory } from './api'

/** Slugs estables para URLs (?cat=…) — colecciones genéricas (ES / EN). */
export type ProductCategorySlug =
  | 'mujer'
  | 'hombre'
  | 'ninos'
  | 'accesorios'
  | 'hogar'
  | 'novedades'
  | 'destacados'
  | 'ofertas'
  | 'nuevo'

const LINE_SLUG: Record<
  Exclude<ProductCategorySlug, 'destacados' | 'ofertas' | 'nuevo'>,
  { ESPA: string; ENGL: string }
> = {
  mujer: { ESPA: 'Mujer', ENGL: 'Women' },
  hombre: { ESPA: 'Hombre', ENGL: 'Men' },
  ninos: { ESPA: 'Niños', ENGL: 'Kids' },
  accesorios: { ESPA: 'Accesorios', ENGL: 'Accessories' },
  hogar: { ESPA: 'Hogar', ENGL: 'Home' },
  novedades: { ESPA: 'Novedades', ENGL: 'New in' },
}

const ALIAS_MAP: Record<'destacados' | 'ofertas' | 'nuevo', keyof typeof LINE_SLUG> = {
  destacados: 'novedades',
  ofertas: 'novedades',
  nuevo: 'novedades',
}

export function resolveProductCategorySlug(
  categories: ProductCategory[],
  lang: ApiLang,
  slug: string | null | undefined
): number | undefined {
  if (!slug || !categories.length) return undefined
  const s = slug.toLowerCase().trim() as ProductCategorySlug
  const lineKey: keyof typeof LINE_SLUG | undefined =
    s in ALIAS_MAP ? ALIAS_MAP[s as keyof typeof ALIAS_MAP] : (s as keyof typeof LINE_SLUG)
  if (!lineKey || !LINE_SLUG[lineKey]) return undefined
  const want = LINE_SLUG[lineKey][lang]
  const row = categories.find((c) => c.des_category === want)
  return row?.id_category
}

export function categoryIdToSlug(categories: ProductCategory[], lang: ApiLang, id: number): ProductCategorySlug | undefined {
  const cat = categories.find((c) => c.id_category === id)
  if (!cat) return undefined
  const entry = (Object.keys(LINE_SLUG) as (keyof typeof LINE_SLUG)[]).find(
    (key) => LINE_SLUG[key][lang] === cat.des_category
  )
  return entry as ProductCategorySlug | undefined
}
