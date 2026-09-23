import { Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import { Home } from './pages/Home'
import { Productos } from './pages/Productos'
import { ProductoDetalle } from './pages/ProductoDetalle'
import { Sistemas } from './pages/Sistemas'
import { Viviendas } from './pages/Viviendas'
import { NuestraEmpresa } from './pages/NuestraEmpresa'
import { Contacto } from './pages/Contacto'
import { Cotizar } from './pages/Cotizar'
import { AsesoriaTecnica } from './pages/AsesoriaTecnica'
import { Admin } from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route index element={<Home />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/productos/:id" element={<ProductoDetalle />} />
        <Route path="/sistemas" element={<Sistemas />} />
        <Route path="/destacados" element={<Viviendas />} />
        <Route path="/viviendas" element={<Navigate to="/destacados" replace />} />
        <Route path="/nuestra-empresa" element={<NuestraEmpresa />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/asesoria-tecnica" element={<AsesoriaTecnica />} />
        <Route path="/carrito" element={<Cotizar />} />
        <Route path="/cotizar" element={<Navigate to="/carrito" replace />} />
        <Route path="/admin/*" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
