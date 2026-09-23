import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { listProductCategories, listProducts, type ApiLang } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import { categoryIdToSlug, resolveProductCategorySlug } from '../lib/productNav'
import { useEffect, useMemo, useState } from 'react'
import { CatalogCollectionFilter } from '../components/CatalogCollectionFilter'
import { CatalogGrid } from '../components/CatalogGrid'

export function Productos() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const apiLang: ApiLang = isEn ? 'ENGL' : 'ESPA'
  const [searchParams, setSearchParams] = useSearchParams()
  const [cat, setCat] = useState<number | undefined>(undefined)

  const cats = useQuery({
    queryKey: ['product-categories', apiLang],
    queryFn: () => listProductCategories(apiLang),
  })
  const products = useQuery({
    queryKey: ['products', apiLang, cat],
    queryFn: () => listProducts(apiLang, cat),
  })

  useEffect(() => {
    if (!cats.data?.length) return
    const raw = searchParams.get('cat')
    if (!raw) {
      setCat(undefined)
      return
    }
    const id = resolveProductCategorySlug(cats.data, apiLang, raw)
    if (id != null) setCat(id)
    else {
      setCat(undefined)
      setSearchParams({}, { replace: true })
    }
  }, [cats.data, searchParams, apiLang, setSearchParams])

  function setCategory(id: number | undefined) {
    setCat(id)
    if (id == null) {
      setSearchParams({}, { replace: true })
      return
    }
    const slug = categoryIdToSlug(cats.data || [], apiLang, id)
    if (slug) setSearchParams({ cat: slug }, { replace: true })
    else setSearchParams({}, { replace: true })
  }

  const title = useMemo(() => (isEn ? 'Products' : 'Productos'), [isEn])
  const count = products.data?.length ?? 0

  return (
    <div className="pb-16">
      <CatalogCollectionFilter
        categories={cats.data}
        activeId={cat}
        onSelect={setCategory}
        isEn={isEn}
        productCount={count}
        title={title}
      />

      <div className="mt-10">
        {products.isLoading ? (
          <p className="py-20 text-center text-sm text-stone-500">{isEn ? 'Loading…' : 'Cargando…'}</p>
        ) : null}
        {products.isError ? (
          <p className="py-20 text-center text-sm text-red-700">
            {isEn ? 'Could not load products.' : 'No se pudieron cargar productos.'}
          </p>
        ) : null}
        {!products.isLoading && !products.isError ? (
          <CatalogGrid products={products.data} isEn={isEn} />
        ) : null}
      </div>
    </div>
  )
}
