import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

export type QuoteCartItem = {
  id_product: number
  quantity: number
  note?: string
  name_snapshot?: string
}

type Ctx = {
  items: QuoteCartItem[]
  add: (item: QuoteCartItem) => void
  update: (id_product: number, patch: Partial<QuoteCartItem>) => void
  remove: (id_product: number) => void
  clear: () => void
  count: number
}

const QuoteCartContext = createContext<Ctx | null>(null)

const STORAGE = 'venta_online_shop_cart'
const STORAGE_LEGACY = 'venta_online_quote_cart'

function load(): QuoteCartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE) ?? localStorage.getItem(STORAGE_LEGACY)
    if (!raw) return []
    const j = JSON.parse(raw) as QuoteCartItem[]
    return Array.isArray(j) ? j : []
  } catch {
    return []
  }
}

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>(() => load())

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(items))
  }, [items])

  const add = useCallback((item: QuoteCartItem) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.id_product === item.id_product)
      if (i === -1) return [...prev, item]
      const next = [...prev]
      const cur = next[i]!
      next[i] = {
        ...cur,
        quantity: cur.quantity + item.quantity,
        note: item.note ?? cur.note,
        name_snapshot: item.name_snapshot ?? cur.name_snapshot,
      }
      return next
    })
  }, [])

  const update = useCallback((id_product: number, patch: Partial<QuoteCartItem>) => {
    setItems((prev) =>
      prev.map((p) => (p.id_product === id_product ? { ...p, ...patch } : p)),
    )
  }, [])

  const remove = useCallback((id_product: number) => {
    setItems((prev) => prev.filter((p) => p.id_product !== id_product))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const value = useMemo(
    () => ({
      items,
      add,
      update,
      remove,
      clear,
      count: items.reduce((s, i) => s + i.quantity, 0),
    }),
    [items, add, update, remove, clear],
  )

  return <QuoteCartContext.Provider value={value}>{children}</QuoteCartContext.Provider>
}

export function useQuoteCart() {
  const c = useContext(QuoteCartContext)
  if (!c) throw new Error('useQuoteCart inside provider')
  return c
}
