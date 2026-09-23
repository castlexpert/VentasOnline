import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ChatbotWidget } from './ChatbotWidget'
import { useLanguage } from '../i18n/LanguageContext'
import { useQuoteCart } from '../cart/QuoteCartContext'
import { BRAND_NAME, CONTACT_EMAIL, CONTACT_PHONE, NAV_MARK_PHOTO_URL, PAGE_BG_TONE_HEX } from '../constants/brand'
import { GLASS_NAV } from '../constants/glass'

type MegaSection = { title: string; links: { label: string; to: string }[] }
type MegaMenu = { id: string; label: string; to?: string; sections?: MegaSection[] }

export function Shell() {
  const { lang, setLang } = useLanguage()
  const { count: cartCount } = useQuoteCart()
  const isEn = lang === 'en'
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const megaMenus: MegaMenu[] = [
    {
      id: 'productos',
      label: isEn ? 'Shop' : 'Tienda',
      to: '/productos',
      sections: [
        {
          title: isEn ? 'Categories' : 'Categorías',
          links: [
            { label: isEn ? 'Women' : 'Mujer', to: '/productos?cat=mujer' },
            { label: isEn ? 'Men' : 'Hombre', to: '/productos?cat=hombre' },
            { label: isEn ? 'Kids' : 'Niños', to: '/productos?cat=ninos' },
            { label: isEn ? 'Accessories' : 'Accesorios', to: '/productos?cat=accesorios' },
            { label: isEn ? 'Home' : 'Hogar', to: '/productos?cat=hogar' },
            { label: isEn ? 'New in' : 'Novedades', to: '/productos?cat=novedades' },
          ],
        },
        {
          title: isEn ? 'Highlights' : 'Destacados',
          links: [
            { label: isEn ? 'Featured picks' : 'Destacados', to: '/destacados' },
            { label: isEn ? 'Shop by department' : 'Por departamento', to: '/sistemas' },
          ],
        },
      ],
    },
    {
      id: 'servicios',
      label: isEn ? 'Customer care' : 'Atención',
      to: '/carrito',
      sections: [
        {
          title: isEn ? 'Orders' : 'Pedidos',
          links: [
            { label: isEn ? 'Shopping help' : 'Ayuda con tu compra', to: '/asesoria-tecnica' },
            { label: isEn ? 'Shopping cart' : 'Carrito de compras', to: '/carrito' },
            { label: isEn ? 'Stores' : 'Tiendas', to: '/contacto' },
          ],
        },
        {
          title: isEn ? 'More' : 'Más',
          links: [
            { label: isEn ? 'Company' : 'Empresa', to: '/nuestra-empresa' },
            { label: isEn ? 'Contact' : 'Contacto', to: '/contacto' },
          ],
        },
      ],
    },
    { id: 'ubicaciones', label: isEn ? 'Stores' : 'Tiendas', to: '/contacto' },
    { id: 'catalogo', label: isEn ? 'Featured' : 'Destacados', to: '/destacados' },
    { id: 'empresa', label: isEn ? 'About' : 'Nosotros', to: '/nuestra-empresa' },
  ]

  return (
    <div
      className="min-h-dvh font-sans text-stone-900"
      style={{
        background: `linear-gradient(to right, #ffffff 0%, #ffffff 38%, ${PAGE_BG_TONE_HEX} 100%)`,
      }}
    >
      <header className="sticky top-0 z-30 pt-3">
        <div className="mx-auto mb-2 flex max-w-7xl items-center justify-between px-4 text-xs text-zinc-600">
          <span>
            {isEn ? 'Free shipping on selected orders · Pay in colones' : 'Envío gratis en pedidos seleccionados · Paga en colones'}
          </span>
          <span className="hidden md:block">
            {CONTACT_PHONE} • {CONTACT_EMAIL}
          </span>
        </div>

        <div className="mx-auto max-w-7xl px-4">
          <div className={GLASS_NAV}>
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <NavLink to="/" className="flex shrink-0 items-center gap-3">
                <img
                  src={NAV_MARK_PHOTO_URL}
                  alt=""
                  width={108}
                  height={108}
                  className="h-[72px] w-[72px] shrink-0 border border-white/60 object-cover shadow-sm sm:h-[96px] sm:w-[96px] md:h-[108px] md:w-[108px]"
                  decoding="async"
                />
                <div className="leading-tight">
                  <div className="text-sm font-semibold tracking-tight">{BRAND_NAME}</div>
                  <div className="text-xs text-zinc-500">
                    {isEn ? 'Online store' : 'Tienda en línea'}
                  </div>
                </div>
              </NavLink>

              <div className="hidden lg:block">
                <nav
                  className="relative border border-zinc-200/80 bg-white/50 p-1 shadow-sm backdrop-blur-sm"
                  onMouseLeave={() => setOpenMenu(null)}
                >
                  <div className="flex items-center gap-0">
                    {megaMenus.map((menu) => {
                      const isOpen = openMenu === menu.id
                      const hasPanel = !!menu.sections?.length
                      if (!hasPanel) {
                        return (
                          <NavLink
                            key={menu.id}
                            to={menu.to || '/'}
                            className={({ isActive }) =>
                              [
                                'px-3 py-2 text-sm font-medium transition',
                                isActive
                                  ? 'bg-zinc-900 text-white'
                                  : 'text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900',
                              ].join(' ')
                            }
                          >
                            {menu.label}
                          </NavLink>
                        )
                      }

                      return (
                        <button
                          key={menu.id}
                          type="button"
                          onMouseEnter={() => setOpenMenu(menu.id)}
                          onClick={() => setOpenMenu((current) => (current === menu.id ? null : menu.id))}
                          className={[
                            'px-3 py-2 text-sm font-medium transition',
                            isOpen
                              ? 'bg-zinc-900 text-white'
                              : 'text-zinc-700 hover:bg-zinc-100/80 hover:text-zinc-900',
                          ].join(' ')}
                        >
                          {menu.label}
                        </button>
                      )
                    })}
                  </div>

                  {megaMenus
                    .filter((m) => m.sections?.length && m.id === openMenu)
                    .map((menu) => (
                      <div
                        key={menu.id}
                        onMouseEnter={() => setOpenMenu(menu.id)}
                        className="absolute left-0 right-0 top-full z-20 border border-t-0 border-zinc-200 bg-white/95 p-5 pt-5 text-zinc-900 shadow-xl backdrop-blur"
                      >
                        <div className="mb-3 flex items-center justify-between border-b border-zinc-200 pb-3">
                          <span className="text-sm font-semibold">{menu.label}</span>
                          {menu.to ? (
                            <NavLink
                              to={menu.to}
                              onClick={() => setOpenMenu(null)}
                              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
                            >
                              {isEn ? 'View all' : 'Ver todo'}
                            </NavLink>
                          ) : null}
                        </div>
                        <div className="grid gap-5 md:grid-cols-2">
                          {menu.sections?.map((section) => (
                            <div key={section.title}>
                              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                {section.title}
                              </h3>
                              <ul className="mt-2 grid gap-1">
                                {section.links.map((link) => (
                                  <li key={link.label}>
                                    <NavLink
                                      to={link.to}
                                      onClick={() => setOpenMenu(null)}
                                      className="block px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100/90 hover:text-zinc-900"
                                    >
                                      {link.label}
                                    </NavLink>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </nav>
              </div>

              <NavLink
                to="/carrito"
                className="relative bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800 whitespace-nowrap"
              >
                {isEn ? 'Cart' : 'Carrito'}
                {cartCount > 0 ? (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center border border-zinc-900 bg-amber-500 px-1 text-[10px] font-bold text-zinc-950">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                ) : null}
              </NavLink>
              <div className="ml-1 hidden md:flex items-center border border-zinc-200 bg-white/60 p-0 text-xs backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setLang('es')}
                  className={`px-2 py-1 font-semibold ${lang === 'es' ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`border-l border-zinc-200 px-2 py-1 font-semibold ${lang === 'en' ? 'bg-zinc-900 text-white' : 'text-zinc-600'}`}
                >
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1400px] px-4 py-10 md:px-8 md:py-14">
        <Outlet />
      </main>

      <footer className="mt-12 border-t border-zinc-200 bg-white/70 text-zinc-700 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-4">
          <div>
            <div className="text-sm font-semibold text-zinc-900">{BRAND_NAME}</div>
            <p className="mt-2 text-sm text-zinc-600">
              {isEn
                ? 'Fashion and home collections with shopping cart checkout in Costa Rican colones.'
                : 'Moda y hogar con carrito en colones costarricenses.'}
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">
              {isEn ? 'Products and services' : 'Productos y servicios'}
            </div>
            <div className="mt-2 grid gap-1 text-sm text-zinc-600">
              <NavLink to="/productos" className="hover:text-zinc-900">
                {isEn ? 'Products' : 'Productos'}
              </NavLink>
              <NavLink to="/sistemas" className="hover:text-zinc-900">
                {isEn ? 'Shop by category' : 'Por categoría'}
              </NavLink>
              <NavLink to="/destacados" className="hover:text-zinc-900">
                {isEn ? 'Featured' : 'Destacados'}
              </NavLink>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">{isEn ? 'Company' : 'Compañía'}</div>
            <div className="mt-2 grid gap-1 text-sm text-zinc-600">
              <NavLink to="/nuestra-empresa" className="hover:text-zinc-900">
                {isEn ? 'Our company' : 'Nuestra empresa'}
              </NavLink>
              <NavLink to="/contacto" className="hover:text-zinc-900">
                {isEn ? 'Locations' : 'Ubicaciones'}
              </NavLink>
              <NavLink to="/carrito" className="hover:text-zinc-900">
                {isEn ? 'Cart' : 'Carrito'}
              </NavLink>
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900">{isEn ? 'Admin' : 'Administración'}</div>
            <div className="mt-2 grid gap-1 text-sm text-zinc-600">
              <NavLink to="/admin/dashboard" className="hover:text-zinc-900">
                {isEn ? 'Admin' : 'Administración'}
              </NavLink>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500">
          <div>
            {BRAND_NAME} © {new Date().getFullYear()} —{' '}
            {isEn ? 'All rights reserved.' : 'Todos los derechos reservados.'}
          </div>
          <div className="mt-2">
            By{' '}
            <a
              href="https://castlexpert.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-zinc-900"
            >
              castlexpert.com
            </a>
          </div>
        </div>
      </footer>
      <ChatbotWidget />
    </div>
  )
}

