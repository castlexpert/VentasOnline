import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './AdminShell'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'
import { AdminCategorias } from './AdminCategorias'
import { AdminProductos } from './AdminProductos'
import { AdminTiendas } from './AdminTiendas'
import { AdminCotizadores } from './AdminCotizadores'
import { AdminCotizaciones } from './AdminCotizaciones'
import { AdminUsuarios } from './AdminUsuarios'

export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />
      <Route element={<AdminShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="categorias" element={<AdminCategorias />} />
        <Route path="productos" element={<AdminProductos />} />
        <Route path="tiendas" element={<AdminTiendas />} />
        <Route path="cotizadores" element={<AdminCotizadores />} />
        <Route path="cotizaciones" element={<AdminCotizaciones />} />
        <Route path="usuarios" element={<AdminUsuarios />} />
      </Route>
    </Routes>
  )
}
