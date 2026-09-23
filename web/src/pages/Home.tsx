import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import { BRAND_NAME, HERO_IMAGE_URL, HOME_HERO_VISUAL_URL } from '../constants/brand'
import { GLASS_NAV } from '../constants/glass'
import { HomeNewArrivals } from './HomeNewArrivals'

export function Home() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const [heroSrc, setHeroSrc] = useState(HOME_HERO_VISUAL_URL)

  return (
    <div className="grid gap-10">
      <section
        className="border border-neutral-950 bg-neutral-950 shadow-xl"
        aria-label={isEn ? `${BRAND_NAME} promotional image` : `Imagen destacada ${BRAND_NAME}`}
      >
        <div className="relative min-h-[220px] w-full overflow-hidden sm:min-h-[280px] md:min-h-[320px] lg:min-h-[360px]">
          <img
            src={heroSrc}
            alt={isEn ? `${BRAND_NAME} — fashion retail` : `${BRAND_NAME} — tienda y moda`}
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            sizes="(max-width: 1400px) 100vw, 1400px"
            onError={() => setHeroSrc((prev) => (prev === HERO_IMAGE_URL ? prev : HERO_IMAGE_URL))}
          />
        </div>
      </section>

      <HomeNewArrivals isEn={isEn} />

      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: isEn ? 'Collections' : 'Colecciones',
            body: isEn
              ? 'Shop women, men, kids, accessories and home — updated like a modern catalog.'
              : 'Mujer, hombre, niños, accesorios y hogar — catálogo claro y fácil de filtrar.',
            cta: isEn ? 'Browse products' : 'Ver productos',
            to: '/productos',
          },
          {
            title: isEn ? 'Cart & orders' : 'Carrito y pedidos',
            body: isEn
              ? 'Review your shopping cart, choose a store and send your order for follow-up.'
              : 'Revise su carrito de compras, elija tienda y envíe su pedido para seguimiento.',
            cta: isEn ? 'Open cart' : 'Ir al carrito',
            to: '/carrito',
          },
        ].map((c) => (
          <article key={c.title} className={`p-6 shadow-md ${GLASS_NAV}`}>
            <h2 className="text-xl font-semibold tracking-tight text-stone-900">{c.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{c.body}</p>
            <Link
              to={c.to}
              className="mt-4 inline-flex border border-stone-900 bg-stone-900 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              {c.cta}
            </Link>
          </article>
        ))}
      </section>

      <section className={`p-7 shadow-lg ${GLASS_NAV}`}>
        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold tracking-tight text-stone-900 md:text-3xl">
              {isEn ? 'Stores near you' : 'Tiendas cerca de usted'}
            </h2>
            <p className="mt-2 text-sm text-stone-800">
              {isEn
                ? 'Metro, Escazú, Heredia and Cartago — same experience online and in store.'
                : 'Metro, Escazú, Heredia y Cartago — misma experiencia en web y en tienda.'}
            </p>
          </div>
          <div className="md:text-right">
            <Link
              to="/contacto"
              className="inline-flex border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
            >
              {isEn ? 'View locations' : 'Ver ubicaciones'}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: isEn ? 'Quality' : 'Calidad',
            body: isEn
              ? 'Curated products and clear descriptions so you know what you buy.'
              : 'Productos curados y descripciones claras para comprar con confianza.',
          },
          {
            title: isEn ? 'Style' : 'Estilo',
            body: isEn
              ? 'Essentials and trends for everyday outfits and home.'
              : 'Básicos y tendencias para el día a día y el hogar.',
          },
          {
            title: isEn ? 'Service' : 'Servicio',
            body: isEn
              ? 'Chat, shopping cart and WhatsApp info when you need it.'
              : 'Chat, carrito de compras y WhatsApp para más información cuando lo necesite.',
          },
        ].map((c) => (
          <article key={c.title} className={`p-6 shadow-md ${GLASS_NAV}`}>
            <h3 className="text-base font-semibold text-stone-900">{c.title}</h3>
            <p className="mt-2 text-sm text-stone-600">{c.body}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
