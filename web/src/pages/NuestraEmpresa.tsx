import { useQuery } from '@tanstack/react-query'
import { getPage } from '../lib/api'
import { useLanguage } from '../i18n/LanguageContext'

export function NuestraEmpresa() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'
  const q = useQuery({
    queryKey: ['page', 'nuestra-empresa'],
    queryFn: () => getPage('nuestra-empresa'),
  })

  if (q.isLoading) return <div className="text-sm text-zinc-600">{isEn ? 'Loading…' : 'Cargando…'}</div>
  if (q.isError) return <div className="text-sm text-red-700">{isEn ? 'Could not load content.' : 'No se pudo cargar el contenido.'}</div>
  const page = q.data!

  const sections = (page.body as any)?.sections as
    | { type: string; title?: string; paragraphs?: string[]; items?: string[] }[]
    | undefined

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
        <p className="text-sm text-zinc-600">
          {isEn
            ? 'Content migrated to database so it can be updated without redeploy.'
            : 'Contenido migrado a base de datos para poder actualizarlo sin redeploy.'}
        </p>
      </header>

      <div className="grid gap-6">
        {sections?.map((s, idx) => (
          <section key={idx} className="rounded-none border border-zinc-200 bg-white p-6">
            {s.title ? <h2 className="text-lg font-semibold">{s.title}</h2> : null}
            {s.paragraphs?.map((p, i) => (
              <p key={i} className="mt-3 text-sm text-zinc-700">
                {p}
              </p>
            ))}
            {s.items?.length ? (
              <ul className="mt-3 list-inside list-disc text-sm text-zinc-700">
                {s.items.map((it, i) => (
                  <li key={i}>{it}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  )
}

