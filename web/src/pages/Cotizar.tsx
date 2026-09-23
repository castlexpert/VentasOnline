import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { authMe, listStores, loginUser, logoutUser, registerUser, submitQuote } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import { useQuoteCart } from '../cart/QuoteCartContext'

export function Cotizar() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const qc = useQueryClient()
  const { items, update, remove, clear } = useQuoteCart()
  const [detQuote, setDetQuote] = useState('')
  const [storeId, setStoreId] = useState<number | ''>('')
  const [done, setDone] = useState(false)
  const [mode, setMode] = useState<'register' | 'login'>('register')
  const [reg, setReg] = useState({ name: '', apellido1: '', phone: '', email: '' })
  const [log, setLog] = useState({ email: '', phone: '' })

  const stores = useQuery({ queryKey: ['stores'], queryFn: listStores })
  const me = useQuery({ queryKey: ['me'], queryFn: authMe })

  const send = useMutation({
    mutationFn: () => {
      if (storeId === '') throw new Error('store')
      return submitQuote({
        id_store: Number(storeId),
        det_quote: detQuote,
        items: items.map((i) => ({
          id_product: i.id_product,
          quantity: i.quantity,
          note: i.note,
        })),
      })
    },
    onSuccess: () => {
      clear()
      setDone(true)
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const regMut = useMutation({
    mutationFn: () =>
      registerUser({
        email: reg.email.trim(),
        name: reg.name.trim(),
        apellido1: reg.apellido1.trim(),
        phone: reg.phone.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
    },
  })

  const logMut = useMutation({
    mutationFn: () => loginUser({ email: log.email.trim(), phone: log.phone.trim() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })

  const logoutMut = useMutation({
    mutationFn: () => logoutUser(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })

  if (done) {
    return (
      <div className="grid gap-4">
        <div className="rounded-none border border-green-200 bg-green-50 p-6 text-sm text-green-900">
          {isEn ? 'Order request sent. We will contact you.' : 'Pedido enviado. Le contactaremos.'}
        </div>
        <button
          type="button"
          disabled={logoutMut.isPending}
          onClick={() => logoutMut.mutate()}
          className="w-fit min-h-11 rounded-none border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
        >
          {isEn ? 'Sign out' : 'Cerrar sesión'}
        </button>
      </div>
    )
  }

  const user = me.data?.user
  const canSubmit = !!user && !user.needsPhone && items.length > 0 && storeId !== ''

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          {isEn ? 'Shopping cart' : 'Carrito de compras'}
        </h1>
        <p className="text-sm text-zinc-600">
          {isEn
            ? 'Add products from the catalog, choose a store and send your order for follow-up.'
            : 'Agregue productos desde el catálogo, elija tienda de retiro y envíe su pedido para seguimiento.'}
        </p>
      </header>

      {!user ? (
        <section className="rounded-none border border-zinc-200 bg-white p-6">
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-none px-3 py-1.5 text-sm ${mode === 'register' ? 'bg-zinc-900 text-white' : 'border'}`}
              onClick={() => setMode('register')}
            >
              {isEn ? 'Register' : 'Registro'}
            </button>
            <button
              type="button"
              className={`rounded-none px-3 py-1.5 text-sm ${mode === 'login' ? 'bg-zinc-900 text-white' : 'border'}`}
              onClick={() => setMode('login')}
            >
              {isEn ? 'Sign in' : 'Iniciar sesión'}
            </button>
          </div>
          {mode === 'register' ? (
            <form
              className="mt-4 grid gap-3 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault()
                regMut.mutate()
              }}
            >
              <input className="rounded-none border px-3 py-2 text-sm" placeholder={isEn ? 'Email' : 'Correo'} value={reg.email} onChange={(e) => setReg((s) => ({ ...s, email: e.target.value }))} />
              <input className="rounded-none border px-3 py-2 text-sm" placeholder={isEn ? 'Name' : 'Nombre'} value={reg.name} onChange={(e) => setReg((s) => ({ ...s, name: e.target.value }))} />
              <input className="rounded-none border px-3 py-2 text-sm" placeholder={isEn ? 'Last name' : 'Apellido'} value={reg.apellido1} onChange={(e) => setReg((s) => ({ ...s, apellido1: e.target.value }))} />
              <input className="rounded-none border px-3 py-2 text-sm" placeholder={isEn ? 'Phone' : 'Teléfono'} value={reg.phone} onChange={(e) => setReg((s) => ({ ...s, phone: e.target.value }))} />
              <button type="submit" className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white">
                {isEn ? 'Create account' : 'Crear cuenta'}
              </button>
            </form>
          ) : (
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                logMut.mutate()
              }}
            >
              <input className="rounded-none border px-3 py-2 text-sm" placeholder="Email" value={log.email} onChange={(e) => setLog((s) => ({ ...s, email: e.target.value }))} />
              <input className="rounded-none border px-3 py-2 text-sm" placeholder={isEn ? 'Phone (must match)' : 'Teléfono (debe coincidir)'} value={log.phone} onChange={(e) => setLog((s) => ({ ...s, phone: e.target.value }))} />
              <button type="submit" className="w-fit rounded-none bg-zinc-900 px-4 py-2 text-sm text-white">
                {isEn ? 'Sign in' : 'Entrar'}
              </button>
            </form>
          )}
        </section>
      ) : (
        <div className="grid gap-3">
          <div className="flex flex-col gap-3 rounded-none border border-zinc-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-700">
              {isEn ? 'Signed in as' : 'Sesión:'}{' '}
              <span className="font-semibold">{user.email}</span>
            </div>
            <button
              type="button"
              disabled={logoutMut.isPending}
              onClick={() => logoutMut.mutate()}
              className="min-h-11 w-full shrink-0 rounded-none border border-zinc-300 bg-zinc-50 px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60 sm:w-auto"
            >
              {isEn ? 'Sign out' : 'Cerrar sesión'}
            </button>
          </div>
          {user.needsPhone ? (
            <PhoneComplete isEn={isEn} onDone={() => qc.invalidateQueries({ queryKey: ['me'] })} />
          ) : null}
        </div>
      )}

      <section className="rounded-none border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold">{isEn ? 'Cart' : 'Carrito'}</h2>
        {items.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">{isEn ? 'Empty.' : 'Vacío.'}</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {items.map((it) => (
              <li key={it.id_product} className="flex flex-wrap items-center gap-2 border-b border-zinc-100 pb-3">
                <span className="min-w-[160px] text-sm font-medium">{it.name_snapshot || `#${it.id_product}`}</span>
                <label className="text-xs text-zinc-600">
                  Qty
                  <input
                    type="number"
                    className="ml-1 w-20 rounded-none border px-2 py-1 text-sm"
                    value={it.quantity}
                    onChange={(e) => update(it.id_product, { quantity: Number(e.target.value) })}
                  />
                </label>
                <input
                  className="min-w-[120px] flex-1 rounded-none border px-2 py-1 text-sm"
                  placeholder={isEn ? 'Line note' : 'Nota'}
                  value={it.note || ''}
                  onChange={(e) => update(it.id_product, { note: e.target.value })}
                />
                <button type="button" className="text-xs text-red-700 underline" onClick={() => remove(it.id_product)}>
                  {isEn ? 'Remove' : 'Quitar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-none border border-zinc-200 bg-white p-6">
        <label className="grid gap-1 text-sm">
          <span className="font-semibold">{isEn ? 'Delivery notes / comments' : 'Notas o comentarios del pedido'}</span>
          <textarea
            className="min-h-[100px] rounded-none border border-zinc-300 px-3 py-2 text-sm"
            value={detQuote}
            onChange={(e) => setDetQuote(e.target.value)}
          />
        </label>

        <label className="mt-4 grid gap-1 text-sm">
          <span className="font-semibold">{isEn ? 'Destination store' : 'Tienda destino'}</span>
          <select
            className="h-10 max-w-md rounded-none border border-zinc-300 px-3 text-sm"
            value={storeId === '' ? '' : String(storeId)}
            onChange={(e) => setStoreId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">{isEn ? 'Select…' : 'Seleccione…'}</option>
            {stores.data?.map((p) => (
              <option key={p.id_store} value={p.id_store}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={!canSubmit || send.isPending}
          onClick={() => send.mutate()}
          className="mt-6 h-10 rounded-none bg-zinc-900 px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {send.isPending ? '…' : isEn ? 'Send order' : 'Enviar pedido'}
        </button>
        {send.isError ? <div className="mt-2 text-sm text-red-700">{(send.error as Error).message}</div> : null}
      </section>
    </div>
  )
}

function PhoneComplete({ isEn, onDone }: { isEn: boolean; onDone: () => void }) {
  const [phone, setPhone] = useState('')
  const m = useMutation({
    mutationFn: () =>
      fetch(`/api/auth/complete-phone`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      }).then((r) => {
        if (!r.ok) throw new Error('fail')
        return r.json()
      }),
    onSuccess: onDone,
  })
  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-none border border-amber-200 bg-amber-50 p-4"
      onSubmit={(e) => {
        e.preventDefault()
        m.mutate()
      }}
    >
      <label className="text-sm">
        {isEn ? 'Phone required' : 'Teléfono obligatorio'}
        <input className="ml-2 rounded-none border px-2 py-1" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>
      <button type="submit" className="rounded-none bg-zinc-900 px-3 py-1 text-sm text-white">
        OK
      </button>
    </form>
  )
}
