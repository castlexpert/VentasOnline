import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

const COPY = {
  es: {
    title: 'Ayuda con tu compra',
    subtitle: 'Guía de tallas, envíos, cambios y soporte antes de finalizar tu compra.',
    p1: `Nuestro equipo le orienta sobre disponibilidad por tienda y combinaciones de colección. Puede usar el carrito en línea o escribir por WhatsApp desde la ficha de cada producto. Si necesita un resumen de pedido o asistencia por producto, háganos saber desde el chat o Contacto.`,
    p2: `Las políticas exactas de devolución y plazos se confirman al procesar cada pedido según la tienda seleccionada. Siempre puede ver ubicaciones y contactos directos en la sección Contacto.`,
    cta: 'Ir al carrito de compras',
    imgAlt: 'Cliente recibiendo asesoría en tienda de moda',
  },
  en: {
    title: 'Shopping help',
    subtitle: 'Sizing guidance, pickup, exchanges and support before you check out.',
    p1: `Our team can help with store availability and outfit ideas. Use the shopping cart checkout or WhatsApp from any product page. Need a basket summary or help with an item? Use chat or reach out via contact details.`,
    p2: `Return windows and delivery timing are confirmed when your order is processed for the chosen store. You can always see locations and contacts on the Stores page.`,
    cta: 'Open shopping cart',
    imgAlt: 'Customer getting help in a clothing store',
  },
}

export function AsesoriaTecnica() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const t = isEn ? COPY.en : COPY.es

  return (
    <div className="grid gap-10">
      <header className="overflow-hidden rounded-none border border-stone-200/80 bg-stone-900 shadow-xl">
        <div className="relative aspect-[21/9] min-h-[200px] w-full sm:min-h-[280px]">
          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=82"
            alt={t.imgAlt}
            className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/35 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{t.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-200 sm:text-base">{t.subtitle}</p>
          </div>
        </div>
      </header>

      <article className="mx-auto grid max-w-3xl gap-6 text-stone-800">
        <p className="text-base leading-relaxed sm:text-lg">{t.p1}</p>
        <p className="text-base leading-relaxed sm:text-lg">{t.p2}</p>
      </article>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/carrito"
          className="inline-flex min-h-11 items-center justify-center rounded-none bg-stone-900 px-5 text-sm font-semibold text-white shadow-md transition hover:bg-stone-800"
        >
          {t.cta}
        </Link>
        <Link
          to="/contacto"
          className="inline-flex min-h-11 items-center justify-center rounded-none border border-stone-300 bg-white px-5 text-sm font-semibold text-stone-900 hover:bg-stone-50"
        >
          {isEn ? 'Stores & contact' : 'Ubicaciones y contacto'}
        </Link>
      </div>
    </div>
  )
}
