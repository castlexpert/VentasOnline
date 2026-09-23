import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import type { ApiLang, Product } from '../../lib/api'
import { API_BASE_URL, adminCreateProductFd, adminDeleteProduct, adminListCategories, adminListProducts, adminUpdateProductFd } from '../../lib/api'

const PAGE = 8

function imgUrl(path: string | null | undefined) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_BASE_URL}${path}`
}

export function AdminProductos() {
  const qc = useQueryClient()
  const [lang, setLang] = useState<'' | ApiLang>('')
  const [catId, setCatId] = useState<number | ''>('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState<Product | 'new' | null>(null)

  const cats = useQuery({ queryKey: ['admin', 'categories', 'all'], queryFn: () => adminListCategories() })
  const prods = useQuery({
    queryKey: ['admin', 'products', lang || 'all', catId === '' ? 'all' : catId],
    queryFn: () => adminListProducts({ language: lang || undefined, categoryId: catId === '' ? undefined : Number(catId) }),
  })

  const del = useMutation({
    mutationFn: (id: number) => adminDeleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  })

  const rows = prods.data || []
  const sliced = useMemo(() => rows.slice(page * PAGE, page * PAGE + PAGE), [rows, page])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Productos</h1>
        <button
          type="button"
          className="rounded-none bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setModal('new')}
        >
          Nuevo producto
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="rounded-none border border-zinc-300 px-3 py-2 text-sm"
          value={lang}
          onChange={(e) => {
            setLang(e.target.value as '' | ApiLang)
            setPage(0)
          }}
        >
          <option value="">Todos los idiomas</option>
          <option value="ESPA">ESPA</option>
          <option value="ENGL">ENGL</option>
        </select>
        <select
          className="rounded-none border border-zinc-300 px-3 py-2 text-sm"
          value={catId === '' ? '' : String(catId)}
          onChange={(e) => {
            setCatId(e.target.value ? Number(e.target.value) : '')
            setPage(0)
          }}
        >
          <option value="">Todas las categorías</option>
          {(cats.data || []).map((c) => (
            <option key={`${c.id_category}-${c.language}`} value={c.id_category}>
              {c.des_category} ({c.language})
            </option>
          ))}
        </select>
      </div>

      {prods.isLoading ? <p className="text-sm text-zinc-600">Cargando…</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sliced.map((p) => (
          <div key={p.id_product} className="overflow-hidden rounded-none border border-zinc-200 bg-white">
            <div className="flex h-36 items-center justify-center bg-zinc-100">
              {p.img_path_name ? (
                <img alt="" src={imgUrl(p.img_path_name)} className="max-h-36 w-full object-contain" />
              ) : (
                <span className="text-xs text-zinc-500">Sin imagen</span>
              )}
            </div>
            <div className="p-4">
              <div className="text-xs text-zinc-500">{p.category?.des_category}</div>
              <div className="mt-1 font-semibold">{p.name_product}</div>
              <div className="mt-2 text-xs text-zinc-600">
                {p.language} · ID {p.id_product}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-none border px-2 py-1 text-xs" onClick={() => setModal(p)}>
                  Editar
                </button>
                {p.pdf_path_name ? (
                  <a
                    className="rounded-none border px-2 py-1 text-xs"
                    href={imgUrl(p.pdf_path_name)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>
                ) : null}
                <button
                  type="button"
                  className="text-xs text-red-700"
                  onClick={() => confirm('¿Eliminar?') && del.mutate(p.id_product)}
                >
                  Borrar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button type="button" disabled={page <= 0} className="rounded-none border px-3 py-1 disabled:opacity-40" onClick={() => setPage((x) => Math.max(0, x - 1))}>
          Anterior
        </button>
        <span>
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages - 1}
          className="rounded-none border px-3 py-1 disabled:opacity-40"
          onClick={() => setPage((x) => Math.min(pages - 1, x + 1))}
        >
          Siguiente
        </button>
      </div>

      {modal ? (
        <ProductModal
          cats={cats.data || []}
          product={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'products'] })
            setModal(null)
          }}
        />
      ) : null}
    </div>
  )
}

function ProductModal(props: {
  cats: { id_category: number; des_category: string; language: ApiLang }[]
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const [id_category, setIdCategory] = useState(props.product?.id_category || props.cats[0]?.id_category || 0)
  const [language, setLanguage] = useState<ApiLang>(props.product?.language || 'ESPA')
  const [name_product, setName] = useState(props.product?.name_product || '')
  const [desc_product, setDesc] = useState(props.product?.desc_product || '')
  const [det_product, setDet] = useState(props.product?.det_product || '')
  const [amount, setAmount] = useState(props.product?.amount || '')
  const [image, setImage] = useState<File | null>(null)
  const [pdf, setPdf] = useState<File | null>(null)

  useEffect(() => {
    const first = props.cats.find((c) => c.language === language)?.id_category
    if (first && !props.product) setIdCategory(first)
  }, [language, props.cats, props.product])

  const save = useMutation({
    mutationFn: async () => {
      const fd = new FormData()
      fd.set('id_category', String(id_category))
      fd.set('language', language)
      fd.set('name_product', name_product)
      if (desc_product) fd.set('desc_product', desc_product)
      if (det_product) fd.set('det_product', det_product)
      if (amount) fd.set('amount', amount)
      if (image) fd.append('image', image)
      if (pdf) fd.append('pdf', pdf)
      if (props.product) {
        return adminUpdateProductFd(props.product.id_product, fd)
      }
      return adminCreateProductFd(fd)
    },
    onSuccess: props.onSaved,
  })

  const catOptions = props.cats.filter((c) => c.language === language)

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-none border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">{props.product ? 'Editar producto' : 'Nuevo producto'}</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Idioma
            <select
              className="rounded-none border px-3 py-2"
              value={language}
              onChange={(e) => setLanguage(e.target.value as ApiLang)}
            >
              <option value="ESPA">ESPA</option>
              <option value="ENGL">ENGL</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Categoría
            <select
              className="rounded-none border px-3 py-2"
              value={id_category}
              onChange={(e) => setIdCategory(Number(e.target.value))}
            >
              {catOptions.map((c) => (
                <option key={c.id_category} value={c.id_category}>
                  {c.des_category}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Nombre
            <input className="rounded-none border px-3 py-2" value={name_product} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Descripción corta
            <textarea className="rounded-none border px-3 py-2" rows={2} value={desc_product} onChange={(e) => setDesc(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Ficha / detalle técnico
            <textarea className="rounded-none border px-3 py-2" rows={4} value={det_product} onChange={(e) => setDet(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Precio referencia (opcional)
            <input className="rounded-none border px-3 py-2" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Imagen (.webp u otro)
            <input type="file" accept="image/*,.webp" onChange={(e) => setImage(e.target.files?.[0] || null)} />
          </label>
          <label className="grid gap-1 text-sm">
            PDF ficha
            <input type="file" accept="application/pdf" onChange={(e) => setPdf(e.target.files?.[0] || null)} />
          </label>
          {props.product?.img_path_name ? (
            <div className="text-xs text-zinc-600">Imagen actual: {props.product.img_path_name}</div>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-none border px-4 py-2 text-sm" onClick={props.onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            disabled={!name_product.trim() || save.isPending}
            onClick={() => save.mutate()}
          >
            Guardar
          </button>
        </div>
        {save.isError ? (
          <pre className="mt-3 max-h-32 overflow-auto rounded-none bg-red-50 p-2 text-xs text-red-800">
            {(save.error as Error).message}
          </pre>
        ) : null}
      </div>
    </div>
  )
}
