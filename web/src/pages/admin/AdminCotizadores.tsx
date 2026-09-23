import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  adminCreateQuoter,
  adminDeleteQuoter,
  adminListStoresPrivate,
  adminListQuoters,
  adminUpdateQuoter,
  type QuoterRow,
} from '../../lib/api'

export function AdminCotizadores() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin', 'quoters'], queryFn: adminListQuoters })
  const stores = useQuery({ queryKey: ['admin', 'stores'], queryFn: adminListStoresPrivate })
  const [modal, setModal] = useState<QuoterRow | 'new' | null>(null)

  const del = useMutation({
    mutationFn: (x: { email: string; id_store: number }) => adminDeleteQuoter(x.email, x.id_store),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'quoters'] }),
  })

  return (
    <div className="grid gap-6">
      <div className="flex justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Cotizadores</h1>
        <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => setModal('new')}>
          Nuevo cotizador
        </button>
      </div>
      <div className="overflow-x-auto rounded-none border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Tienda</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">CC</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(q.data || []).map((r) => (
              <tr key={`${r.email_quoter}-${r.id_store}`} className="border-b border-zinc-100">
                <td className="px-4 py-3">{r.email_quoter}</td>
                <td className="px-4 py-3">{r.store?.name || r.id_store}</td>
                <td className="px-4 py-3">{r.name}</td>
                <td className="max-w-[180px] truncate px-4 py-3 text-xs">{r.cc_email}</td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" className="text-xs font-semibold" onClick={() => setModal(r)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="text-xs text-red-700"
                    onClick={() => confirm('¿Eliminar?') && del.mutate({ email: r.email_quoter, id_store: r.id_store })}
                  >
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal ? (
        <QuoterModal
          key={modal === 'new' ? 'new-quoter' : `${modal.email_quoter}-${modal.id_store}`}
          stores={stores.data || []}
          row={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'quoters'] })
            setModal(null)
          }}
        />
      ) : null}
    </div>
  )
}

function QuoterModal(props: {
  stores: { id_store: number; name: string }[]
  row: QuoterRow | null
  onClose: () => void
  onSaved: () => void
}) {
  const [email_quoter, setEmail] = useState(props.row?.email_quoter || '')
  const [id_store, setStoreId] = useState(props.row?.id_store || props.stores[0]?.id_store || 0)
  const [name, setName] = useState(props.row?.name || '')
  const [apellido1, setA1] = useState(props.row?.apellido1 || '')
  const [apellido2, setA2] = useState(props.row?.apellido2 || '')
  const [phone, setPhone] = useState(props.row?.phone || '')
  const [phone2, setPhone2] = useState(props.row?.phone2 || '')
  const [address, setAddress] = useState(props.row?.address || '')
  const [cc_email, setCc] = useState(props.row?.cc_email || '')

  const save = useMutation({
    mutationFn: () => {
      if (props.row) {
        return adminUpdateQuoter(props.row.email_quoter, props.row.id_store, {
          email_quoter: email_quoter.trim().toLowerCase(),
          id_store,
          name,
          apellido1,
          apellido2,
          phone,
          phone2,
          address,
          cc_email,
        })
      }
      return adminCreateQuoter({ email_quoter: email_quoter.trim().toLowerCase(), id_store, name, apellido1, apellido2, phone, phone2, address, cc_email })
    },
    onSuccess: props.onSaved,
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-none border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">{props.row ? 'Editar cotizador' : 'Nuevo cotizador'}</h2>
        {props.row ? (
          <p className="mt-2 text-xs text-zinc-600">
            Puede modificar el correo y la Tienda; si cambia la combinación, no debe existir ya otro cotizador con el mismo correo y Tienda.
          </p>
        ) : null}
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Email cotizador
            <input
              className="rounded-none border px-3 py-2"
              type="email"
              value={email_quoter}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Tienda
            <select
              className="rounded-none border px-3 py-2"
              value={id_store}
              onChange={(e) => setStoreId(Number(e.target.value))}
            >
              {props.stores.map((p) => (
                <option key={p.id_store} value={p.id_store}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            Nombre
            <input className="rounded-none border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Apellido 1
            <input className="rounded-none border px-3 py-2" value={apellido1} onChange={(e) => setA1(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Apellido 2
            <input className="rounded-none border px-3 py-2" value={apellido2} onChange={(e) => setA2(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Teléfono
            <input className="rounded-none border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Teléfono 2
            <input className="rounded-none border px-3 py-2" value={phone2} onChange={(e) => setPhone2(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Dirección
            <input className="rounded-none border px-3 py-2" value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            CC (separados por coma)
            <input className="rounded-none border px-3 py-2" value={cc_email} onChange={(e) => setCc(e.target.value)} />
          </label>
        </div>
        {save.isError ? (
          <p className="mt-3 text-sm text-red-700">{(save.error as Error).message || 'No se pudo guardar.'}</p>
        ) : null}
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-none border px-4 py-2 text-sm" onClick={props.onClose}>
            Cancelar
          </button>
          <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white" onClick={() => save.mutate()} disabled={save.isPending || !email_quoter || !name}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
