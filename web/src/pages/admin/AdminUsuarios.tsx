import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { adminCreateUser, adminListUsers, adminUserResetPassword, adminUserSetStatus, type AdminUserRow } from '../../lib/api'

export function AdminUsuarios() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin', 'users'], queryFn: adminListUsers })
  const [creating, setCreating] = useState(false)
  const [resetUser, setResetUser] = useState<string | null>(null)

  const toggle = useMutation({
    mutationFn: (args: { user: string; st: 'ACTIVO' | 'INACTIVO' }) => adminUserSetStatus(args.user, args.st),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  })

  return (
    <div className="grid gap-6">
      <div className="flex justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios administradores</h1>
        <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" onClick={() => setCreating(true)}>
          Nuevo administrador
        </button>
      </div>

      <div className="overflow-x-auto rounded-none border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(q.data || []).map((u: AdminUserRow) => (
              <tr key={u.user} className="border-b border-zinc-100">
                <td className="px-4 py-3 font-mono text-xs">{u.user}</td>
                <td className="px-4 py-3">
                  {u.name} {u.apellido1}
                </td>
                <td className="px-4 py-3 text-xs">{u.ind_tip_user}</td>
                <td className="px-4 py-3">{u.ind_status}</td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  <button type="button" className="text-xs font-semibold" onClick={() => setResetUser(u.user)}>
                    Reset clave
                  </button>
                  <button
                    type="button"
                    className="text-xs"
                    onClick={() =>
                      toggle.mutate({ user: u.user, st: u.ind_status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' })
                    }
                  >
                    {u.ind_status === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {creating ? (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'users'] })
            setCreating(false)
          }}
        />
      ) : null}

      {resetUser ? (
        <ResetModal
          user={resetUser}
          onClose={() => setResetUser(null)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['admin', 'users'] })
            setResetUser(null)
          }}
        />
      ) : null}
    </div>
  )
}

function CreateUserModal(props: { onClose: () => void; onSaved: () => void }) {
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [apellido1, setA1] = useState('')

  const m = useMutation({
    mutationFn: () => adminCreateUser({ user, password, name, apellido1 }),
    onSuccess: props.onSaved,
  })

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-none border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Nuevo administrador</h2>
        <div className="mt-4 grid gap-3">
          <input className="rounded-none border px-3 py-2 text-sm" placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} />
          <input
            className="rounded-none border px-3 py-2 text-sm"
            type="password"
            placeholder="Contraseña (mín. 8)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input className="rounded-none border px-3 py-2 text-sm" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="rounded-none border px-3 py-2 text-sm" placeholder="Apellido" value={apellido1} onChange={(e) => setA1(e.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-none border px-4 py-2 text-sm" onClick={props.onClose}>
            Cancelar
          </button>
          <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white" onClick={() => m.mutate()} disabled={m.isPending}>
            Crear
          </button>
        </div>
      </div>
    </div>
  )
}

function ResetModal(props: { user: string; onClose: () => void; onSaved: () => void }) {
  const [password, setPassword] = useState('')
  const m = useMutation({
    mutationFn: () => adminUserResetPassword(props.user, password),
    onSuccess: props.onSaved,
  })
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-none border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Reset contraseña — {props.user}</h2>
        <input
          className="mt-4 w-full rounded-none border px-3 py-2 text-sm"
          type="password"
          placeholder="Nueva contraseña (mín. 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="rounded-none border px-4 py-2 text-sm" onClick={props.onClose}>
            Cancelar
          </button>
          <button type="button" className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white" onClick={() => m.mutate()}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
