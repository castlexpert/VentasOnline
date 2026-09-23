import { useQuery } from '@tanstack/react-query'
import { listProductCategories, listProducts, type ApiLang } from '../lib/api'
import { findFeaturedCatalogCategoryId } from '../lib/housingCatalog'
import { useLanguage } from '../i18n/LanguageContext'
import { useMemo } from 'react'
import { CatalogGrid } from '../components/CatalogGrid'

export function Viviendas() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const apiLang: ApiLang = isEn ? 'ENGL' : 'ESPA'

  const cats = useQuery({
    queryKey: ['product-categories', apiLang],
    queryFn: () => listProductCategories(apiLang),
  })

  const categoryId = useMemo(
    () => (cats.data?.length ? findFeaturedCatalogCategoryId(cats.data, apiLang) : undefined),
    [cats.data, apiLang],
  )

  const products = useQuery({
    queryKey: ['products', apiLang, 'featured-catalog', categoryId],
    queryFn: () => listProducts(apiLang, categoryId),
    enabled: categoryId != null,
  })

  const title = isEn ? 'Featured' : 'Destacados'
  const count = products.data?.length ?? 0

  return (
    <div className="pb-16">
      <header className="border-b border-stone-200 pb-8">
        <h1 className="font-serif text-3xl tracking-tight text-stone-900 md:text-4xl">
          {title}
          <span className="ml-2 text-base font-sans text-stone-500">[{count}]</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-stone-600">
          {isEn
            ? 'Highlighted styles from the New in collection. Browse in a large gallery.'
            : 'Piezas destacadas de la colección Novedades. Galería amplia.'}
        </p>
      </header>

      <div className="mt-10">
        {cats.isLoading ? <p className="text-sm text-stone-500">{isEn ? 'Loading…' : 'Cargando…'}</p> : null}
        {!cats.isLoading && categoryId == null ? (
          <div className="rounded-none border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {isEn ? (
              <>
                The <strong>New in</strong> collection was not found. Run API migrations (
                <code className="rounded-none bg-white/80 px-1">npm run db:migrate</code>) or create it in admin.
              </>
            ) : (
              <>
                No existe la colección <strong>Novedades</strong>. Ejecute migraciones (
                <code className="rounded-none bg-white/80 px-1">npm run db:migrate</code>) o créela en administración.
              </>
            )}
          </div>
        ) : null}
        {products.isLoading && categoryId != null ? (
          <p className="py-20 text-center text-sm text-stone-500">{isEn ? 'Loading…' : 'Cargando…'}</p>
        ) : null}
        {products.isError ? (
          <p className="py-20 text-center text-sm text-red-700">
            {isEn ? 'Could not load products.' : 'No se pudieron cargar productos.'}
          </p>
        ) : null}
        {categoryId != null && !products.isLoading && !products.isError ? (
          <CatalogGrid products={products.data} isEn={isEn} />
        ) : null}
      </div>
    </div>
  )
}
