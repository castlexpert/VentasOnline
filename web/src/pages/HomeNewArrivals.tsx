import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const SLIDES = [
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=82',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1400&q=82',
  /* Antes 1542293787930 devolvía 404 en Unsplash CDN */
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=82',
]

type Props = { isEn: boolean }

export function HomeNewArrivals({ isEn }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="border border-stone-900 bg-stone-900 text-white">
      <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:items-center md:gap-8 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            {isEn ? 'Just dropped' : 'Recién llegado'}
          </p>
          <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
            {isEn ? 'New arrivals' : 'Nuevos ingresos'}
          </h2>
          <p className="mt-3 max-w-md text-sm text-stone-300">
            {isEn
              ? 'Seasonal edits and staples — swipe through drops before they move to collections.'
              : 'Ediciones de temporada y básicos — recorra nuevas entradas antes de ir al catálogo.'}
          </p>
          <Link
            to="/productos?cat=novedades"
            className="mt-5 inline-flex border border-white bg-white px-4 py-2 text-sm font-semibold text-stone-900 hover:bg-stone-100"
          >
            {isEn ? 'Shop New in' : 'Ver Novedades'}
          </Link>
        </div>

        <div className="relative min-h-[240px] overflow-hidden md:min-h-[300px]">
          {SLIDES.map((src, i) => (
            <div
              key={`new-arrival-${i}`}
              className={`absolute inset-0 transition-opacity duration-[800ms] ease-out ${i === index ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden={i !== index}
            >
              <img src={src} alt="" className="h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/65 via-transparent to-stone-950/25" />
            </div>
          ))}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center gap-2 p-4">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 w-8 border transition ${i === index ? 'border-white bg-white' : 'border-stone-500 bg-transparent hover:border-white'}`}
                aria-label={`${isEn ? 'Slide' : 'Diapositiva'} ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
