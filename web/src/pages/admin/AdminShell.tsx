import { useQuery } from '@tanstack/react-query'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { adminLogout, adminMe } from '../../lib/api'

const linkCls = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-none px-3 py-2 text-sm font-medium',
    isActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100',
  ].join(' ')

export function AdminShell() {
  const navigate = useNavigate()
  const me = useQuery({ queryKey: ['admin', 'me'], queryFn: adminMe, retry: false })

  if (me.isPending) {
    return (
      <div className="rounded-none border border-zinc-200 bg-white p-8 text-sm text-zinc-600">Cargando panel…</div>
    )
  }
  if (me.isError || !me.data?.user) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-none border border-zinc-200 bg-white p-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Administración</div>
        <nav className="grid gap-1">
          <NavLink to="/admin/dashboard" className={linkCls}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/categorias" className={linkCls}>
            Categorías
          </NavLink>
          <NavLink to="/admin/productos" className={linkCls}>
            Productos
          </NavLink>
          <NavLink to="/admin/tiendas" className={linkCls}>
            Tiendas
          </NavLink>
          <NavLink to="/admin/cotizadores" className={linkCls}>
            Cotizadores
          </NavLink>
          <NavLink to="/admin/cotizaciones" className={linkCls}>
            Cotizaciones
          </NavLink>
          <NavLink to="/admin/usuarios" className={linkCls}>
            Usuarios admin
          </NavLink>
        </nav>
        <button
          type="button"
          className="mt-6 w-full rounded-none border border-zinc-300 py-2 text-sm font-semibold hover:bg-zinc-50"
          onClick={async () => {
            await adminLogout()
            await me.refetch()
            navigate('/admin/login')
          }}
        >
          Salir
        </button>
      </aside>
      <section className="min-w-0">
        <Outlet />
      </section>
    </div>
  )
}
