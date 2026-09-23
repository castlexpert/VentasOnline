import { useQuery } from '@tanstack/react-query'
import { listStores } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'
import { CONTACT_EMAIL, CONTACT_PHONE } from '../constants/brand'

export function Contacto() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const q = useQuery({ queryKey: ['stores'], queryFn: listStores })

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-serif text-3xl tracking-tight text-stone-900">{isEn ? 'Contact & stores' : 'Contacto y tiendas'}</h1>
        <p className="text-sm text-stone-600">
          {isEn ? 'Head office line and pickup locations.' : 'Línea central y puntos de retiro.'}
        </p>
        <div className="rounded-none border border-stone-200 bg-white p-4 text-sm text-stone-700 shadow-sm">
          <p className="font-semibold text-stone-900">{isEn ? 'National line' : 'Línea nacional'}</p>
          <a className="mt-1 block hover:underline" href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`}>
            {CONTACT_PHONE}
          </a>
          <a className="mt-1 block hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </div>
      </header>

      {q.isLoading ? <div className="text-sm text-zinc-600">{isEn ? 'Loading…' : 'Cargando…'}</div> : null}
      {q.isError ? (
        <div className="text-sm text-red-700">
          {isEn ? 'Could not load contacts.' : 'No se pudieron cargar los contactos.'}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {q.data?.map((p) => (
          <section key={p.id_store} className="rounded-none border border-zinc-200 bg-white p-6">
            <h2 className="text-base font-semibold">{p.name}</h2>
            <p className="mt-2 text-sm text-zinc-700">{p.address}</p>
            <div className="mt-4 grid gap-1 text-sm">
              <a className="text-zinc-900 hover:underline" href={`tel:${p.phone.replace(/\s/g, '')}`}>
                {p.phone}
              </a>
              <a className="text-zinc-900 hover:underline" href={`mailto:${p.email}`}>
                {p.email}
              </a>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

