import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminCreateStore, adminDeleteStore, adminListStoresPrivate, adminUpdateStore, type Store } from '../../lib/api'

export function AdminTiendas() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin', 'stores'], queryFn: adminListStoresPrivate })
  const [modal, setModal] = useState<Store | 'new' | null>(null)

  const del = useMutation({
    mutationFn: (id: number) => adminDeleteStore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  })

  return (
    <div className="grid gap-6">
      <div className="flex justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Tiendas</h1>
        <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => setModal('new')}>
          Nueva tienda
        </button>
      </div>
      <div className="overflow-x-auto rounded-none border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(q.data || []).map((p) => (
              <tr key={p.id_store} className="border-b border-zinc-100">
                <td className="px-4 py-3 font-mono text-xs">{p.id_store}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3">{p.phone}</td>
                <td className="px-4 py-3">{p.email}</td>
                <td className="space-x-2 px-4 py-3 text-right">
                  <button type="button" className="text-xs font-semibold" onClick={() => setModal(p)}>
                    Editar
                  </button>
                  <button type="button" className="text-xs text-red-700" onClick={() => confirm('¿Borrar?') && del.mutate(p.id_store)}>
                    Borrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal ? (
        <StoreModal
          store={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'stores'] })
            setModal(null)
          }}
        />
      ) : null}
    </div>
  )
}

function StoreModal(props: { store: Store | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(props.store?.name || '')
  const [address, setAddress] = useState(props.store?.address || '')
  const [phone, setPhone] = useState(props.store?.phone || '')
  const [email, setEmail] = useState(props.store?.email || '')

  const save = useMutation({
    mutationFn: () => {
      if (props.store) {
        return adminUpdateStore(props.store.id_store, { name, address, phone, email })
      }
      return adminCreateStore({ name, address, phone, email })
    },
    onSuccess: props.onSaved,
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-none border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">{props.store ? 'Editar tienda' : 'Nueva tienda'}</h2>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-sm">
            Nombre
            <input className="rounded-none border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Dirección
            <textarea className="rounded-none border px-3 py-2" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Teléfono
            <input className="rounded-none border px-3 py-2" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="grid gap-1 text-sm">
            Email
            <input className="rounded-none border px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-none border px-4 py-2 text-sm" onClick={props.onClose}>
            Cancelar
          </button>
          <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white" onClick={() => save.mutate()} disabled={save.isPending}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
