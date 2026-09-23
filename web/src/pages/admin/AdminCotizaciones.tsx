import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { AdminQuoteRow } from '../../lib/api'
import {
  adminListStoresPrivate,
  adminListQuotes,
  adminPatchQuoteStatus,
  adminQuoteDetail,
  adminResendQuoteEmail,
} from '../../lib/api'

const STATUSES = ['', 'Solicitada', 'Enviada', 'Error', 'Atendida'] as const

export function AdminCotizaciones() {
  const qc = useQueryClient()
  const stores = useQuery({ queryKey: ['admin', 'stores'], queryFn: adminListStoresPrivate })

  const [status, setStatus] = useState('')
  const [id_store, setIdStore] = useState<number | ''>('')
  const [date_from, setDateFrom] = useState('')
  const [date_to, setDateTo] = useState('')
  const [detailRow, setDetailRow] = useState<AdminQuoteRow | null>(null)

  const list = useQuery({
    queryKey: ['admin', 'quotes', status, id_store, date_from, date_to],
    queryFn: () =>
      adminListQuotes({
        status: status || undefined,
        id_store: id_store === '' ? undefined : Number(id_store),
        date_from: date_from || undefined,
        date_to: date_to || undefined,
      }),
  })

  const detailQ = useQuery({
    queryKey: ['admin', 'quote-detail', detailRow?.user_quote, detailRow?.quote_id],
    queryFn: () =>
      adminQuoteDetail(String(detailRow!.user_quote), Number(detailRow!.quote_id)),
    enabled: !!(detailRow?.user_quote != null && detailRow?.quote_id != null),
  })

  const patch = useMutation({
    mutationFn: (args: { user: string; id: number; st: string }) => adminPatchQuoteStatus(args.user, args.id, args.st),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'quotes'] })
      detailQ.refetch()
    },
  })

  const resend = useMutation({
    mutationFn: (args: { user: string; id: number }) => adminResendQuoteEmail({ user_quote: args.user, quote_id: args.id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'quotes'] }),
  })

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Cotizaciones</h1>

      <div className="flex flex-wrap gap-3 rounded-none border border-zinc-200 bg-white p-4">
        <label className="grid gap-1 text-sm">
          Estado
          <select className="rounded-none border px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'Todos'}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Tienda
          <select className="rounded-none border px-3 py-2" value={id_store === '' ? '' : String(id_store)} onChange={(e) => setIdStore(e.target.value ? Number(e.target.value) : '')}>
            <option value="">Todas</option>
            {(stores.data || []).map((p) => (
              <option key={p.id_store} value={p.id_store}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Desde (YYYY-MM-DD)
          <input className="rounded-none border px-3 py-2" value={date_from} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="grid gap-1 text-sm">
          Hasta (YYYY-MM-DD)
          <input className="rounded-none border px-3 py-2" value={date_to} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <button type="button" className="mt-6 h-10 rounded-none bg-zinc-900 px-4 text-sm font-semibold text-white" onClick={() => list.refetch()}>
          Filtrar
        </button>
      </div>

      {list.isLoading ? <p className="text-sm text-zinc-600">Cargando…</p> : null}
      {list.isError ? <p className="text-sm text-red-700">Error al cargar la lista.</p> : null}

      <div className="overflow-x-auto rounded-none border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(list.data || []).map((r) => {
              const rq = r as Record<string, unknown>
              const prod = rq.product as { name_product?: string } | undefined
              const name = prod?.name_product
              return (
                <tr key={`${String(rq.user_quote)}-${String(rq.quote_id)}`} className="border-b border-zinc-100">
                  <td className="px-4 py-3 font-mono text-xs">{String(rq.quote_id)}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs">{String(rq.user_quote)}</td>
                  <td className="px-4 py-3 text-xs">{String(rq.date_quote ?? '')}</td>
                  <td className="px-4 py-3">{String(rq.quote_status)}</td>
                  <td className="max-w-[160px] truncate px-4 py-3 text-xs">{name || '-'}</td>
                  <td className="px-4 py-3">{String(rq.total_amount ?? '')}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="text-xs font-semibold" onClick={() => setDetailRow(r)}>
                      Detalle
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {detailRow ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-none border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Detalle cotización #{String((detailRow as any).quote_id)}</h2>
            {detailQ.isLoading ? <p className="mt-4 text-sm text-zinc-600">Cargando…</p> : null}
            {detailQ.data ? (
              <pre className="mt-4 max-h-[50vh] overflow-auto rounded-none bg-zinc-50 p-4 text-xs">{JSON.stringify(detailQ.data, null, 2)}</pre>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <label className="grid gap-1 text-sm">
                Cambiar estado
                <select
                  className="rounded-none border px-3 py-2"
                  defaultValue={String((detailRow as any).quote_status)}
                  onChange={(e) => {
                    const u = String((detailRow as any).user_quote)
                    const id = Number((detailRow as any).quote_id)
                    patch.mutate({ user: u, id, st: e.target.value })
                  }}
                >
                  {STATUSES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              {(detailRow as any).quote_status === 'Error' ? (
                <button
                  type="button"
                  className="mt-6 h-10 rounded-none border border-amber-600 px-4 text-sm font-semibold text-amber-900"
                  onClick={() =>
                    resend.mutate({ user: String((detailRow as any).user_quote), id: Number((detailRow as any).quote_id) })
                  }
                  disabled={resend.isPending}
                >
                  Reenviar correo
                </button>
              ) : null}
            </div>
            {resend.isError ? <p className="mt-2 text-sm text-red-700">{(resend.error as Error).message}</p> : null}

            <button type="button" className="mt-6 rounded-none border px-4 py-2 text-sm" onClick={() => setDetailRow(null)}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
