import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { adminLogin, adminMe } from '../../lib/api'

export function AdminLogin() {
  const qc = useQueryClient()
  const nav = useNavigate()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')

  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: adminMe, retry: false })

  const login = useMutation({
    mutationFn: () => adminLogin(user, password),
    onSuccess: async () => {
      setPassword('')
      await qc.invalidateQueries({ queryKey: ['admin', 'me'] })
      nav('/admin/dashboard')
    },
  })

  if (me.isFetching) {
    return <div className="text-sm text-zinc-600">Comprobando sesión…</div>
  }
  if (me.data?.user) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return (
    <div className="mx-auto max-w-md rounded-none border border-zinc-200 bg-white p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Administración Tienda Online</h1>
      <p className="mt-2 text-sm text-zinc-600">Inicie sesión (sesión hasta 8 h).</p>
      <form
        className="mt-6 grid gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          login.mutate()
        }}
      >
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-semibold text-zinc-700">Usuario</span>
          <input
            className="h-10 rounded-none border border-zinc-300 px-3"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            autoComplete="username"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-semibold text-zinc-700">Contraseña</span>
          <input
            type="password"
            className="h-10 rounded-none border border-zinc-300 px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {login.isError ? <div className="text-sm text-red-700">Credenciales inválidas.</div> : null}
        <button
          type="submit"
          disabled={login.isPending}
          className="h-10 rounded-none bg-zinc-900 text-sm font-semibold text-white disabled:opacity-50"
        >
          {login.isPending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
