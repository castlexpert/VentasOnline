import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { assetUrl, getProduct, type ApiLang } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import { useQuoteCart } from '../cart/QuoteCartContext'
import { useState } from 'react'
import { whatsappProductHref } from '../lib/whatsapp'

export function ProductoDetalle() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const apiLang: ApiLang = isEn ? 'ENGL' : 'ESPA'
  const id = Number(useParams().id || '')
  const { add } = useQuoteCart()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  const q = useQuery({
    queryKey: ['product', id, apiLang],
    queryFn: () => getProduct(id),
    enabled: Number.isFinite(id) && id > 0,
  })

  const backLabel = isEn ? 'Back to catalog' : 'Volver al catálogo'

  const backLink = (
    <Link
      to="/productos"
      className="inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-none border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 shadow-sm active:bg-zinc-100 sm:min-h-11 sm:w-auto sm:justify-start"
    >
      <span className="text-lg leading-none" aria-hidden>
        ←
      </span>
      {backLabel}
    </Link>
  )

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <div className="grid gap-4">
        {backLink}
        <div className="text-sm text-red-700">{isEn ? 'Invalid product.' : 'Producto inválido.'}</div>
      </div>
    )
  }
  if (q.isLoading) {
    return (
      <div className="grid gap-4">
        {backLink}
        <div className="text-sm text-zinc-600">{isEn ? 'Loading…' : 'Cargando…'}</div>
      </div>
    )
  }
  if (q.isError) {
    return (
      <div className="grid gap-4">
        {backLink}
        <div className="text-sm text-red-700">{isEn ? 'Could not load product.' : 'No se pudo cargar el producto.'}</div>
      </div>
    )
  }
  const p = q.data!

  const waHref = whatsappProductHref({
    isEn,
    productName: p.name_product || `#${p.id_product}`,
    productId: p.id_product,
    category: p.category?.des_category,
    referencePriceColon: p.amount ?? null,
    productAbsoluteUrl: `${window.location.origin}/productos/${p.id_product}`,
  })

  return (
    <div className="grid gap-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:gap-8">
      <div className="sticky top-[72px] z-20 -mx-4 border-b border-zinc-200/80 bg-white/95 px-4 py-2 backdrop-blur-md sm:static sm:top-0 sm:z-0 sm:mx-0 sm:rounded-none sm:border sm:border-zinc-200 sm:bg-white sm:py-3 sm:shadow-sm sm:backdrop-blur-none">
        {backLink}
      </div>

      <header className="grid gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {p.category?.des_category}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.name_product}</h1>
        {p.desc_product ? <p className="text-sm leading-relaxed text-zinc-600">{p.desc_product}</p> : null}
        {p.amount != null ? (
          <p className="text-sm font-semibold text-zinc-900">
            {isEn ? 'Reference price' : 'Precio referencia'}: ₡{p.amount}
          </p>
        ) : (
          <p className="text-sm text-amber-800">{isEn ? 'Price: ask via WhatsApp' : 'Precio: consultar por WhatsApp'}</p>
        )}
      </header>

      {p.img_path_name ? (
        <section className="overflow-hidden rounded-none border border-zinc-200 bg-white sm:rounded-none">
          <img
            src={assetUrl(p.img_path_name) || ''}
            alt={p.name_product || `#${p.id_product}`}
            className="max-h-[min(52vh,26rem)] w-full bg-zinc-100 object-contain sm:max-h-[420px]"
          />
        </section>
      ) : null}

      {p.det_product ? (
        <section className="rounded-none border border-zinc-200 bg-white p-4 sm:rounded-none sm:p-6">
          <h2 className="text-base font-semibold">{isEn ? 'Technical sheet' : 'Ficha técnica'}</h2>
          <pre className="mt-3 max-w-full overflow-x-auto whitespace-pre-wrap break-words text-sm text-zinc-700">
            {p.det_product}
          </pre>
          {p.pdf_path_name ? (
            <a
              href={assetUrl(p.pdf_path_name) || ''}
              className="mt-4 inline-flex min-h-11 touch-manipulation items-center text-sm font-semibold text-zinc-900 underline"
              target="_blank"
              rel="noreferrer"
            >
              PDF
            </a>
          ) : null}
        </section>
      ) : (
        <section className="rounded-none border border-zinc-200 bg-white p-4 sm:rounded-none sm:p-6">
          <p className="text-sm text-zinc-600">
            {isEn ? 'Technical content will appear here.' : 'El contenido técnico aparecerá aquí.'}
          </p>
        </section>
      )}

      <section className="grid gap-3 rounded-none border border-zinc-200 bg-white p-4 sm:rounded-none sm:p-6">
        <label className="grid w-full gap-1 text-sm md:max-w-xs">
          <span className="text-xs font-semibold text-zinc-700">{isEn ? 'Quantity' : 'Cantidad'}</span>
          <input
            type="number"
            min={0.01}
            step={0.01}
            inputMode="decimal"
            className="h-12 w-full min-w-0 rounded-none border border-zinc-300 px-3 text-base sm:h-10 sm:text-sm"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => {
              add({
                id_product: p.id_product,
                quantity: qty,
                name_snapshot: p.name_product || undefined,
              })
              setAdded(true)
            }}
            className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-none bg-zinc-900 px-4 text-base font-semibold text-white hover:bg-zinc-800 sm:min-h-10 sm:w-auto sm:text-sm"
          >
            {isEn ? 'Add to cart' : 'Agregar al carrito'}
          </button>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 touch-manipulation items-center justify-center rounded-none border border-[#128C7E] bg-[#25D366] px-4 text-base font-semibold text-white hover:bg-[#20bd5a] sm:min-h-10 sm:w-auto sm:text-sm"
          >
            {isEn ? 'WhatsApp · more info' : 'WhatsApp · más información'}
          </a>
          {added ? (
            <span className="text-sm text-green-800">{isEn ? 'Added.' : 'Agregado.'}</span>
          ) : null}
        </div>
        <p className="text-xs text-zinc-500">
          {isEn
            ? 'WhatsApp opens with a message that includes product name, ID and link.'
            : 'WhatsApp abre con el nombre del producto, ID y enlace incluidos en el mensaje.'}
        </p>
      </section>
    </div>
  )
}
