import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageContext'

export function Sistemas() {
  const { lang } = useLanguage()
  const isEn = lang === 'en'

  const blocks = [
    {
      id: 'mujer',
      title: isEn ? 'Women' : 'Mujer',
      body: isEn ? 'Dresses, tops, denim and more.' : 'Vestidos, tops, denim y más.',
      to: '/productos?cat=mujer',
    },
    {
      id: 'hombre',
      title: isEn ? 'Men' : 'Hombre',
      body: isEn ? 'Shirts, pants, outerwear.' : 'Camisas, pantalones, abrigos.',
      to: '/productos?cat=hombre',
    },
    {
      id: 'ninos',
      title: isEn ? 'Kids' : 'Niños',
      body: isEn ? 'Sizes for growing explorers.' : 'Tallas para pequeños exploradores.',
      to: '/productos?cat=ninos',
    },
    {
      id: 'hogar',
      title: isEn ? 'Home' : 'Hogar',
      body: isEn ? 'Decor and essentials.' : 'Decoración y esenciales.',
      to: '/productos?cat=hogar',
    },
  ]

  return (
    <div className="grid gap-8">
      <header className="grid gap-2">
        <h1 className="font-serif text-3xl tracking-tight text-stone-900 md:text-4xl">
          {isEn ? 'Shop by category' : 'Comprar por categoría'}
        </h1>
        <p className="text-sm text-stone-600">
          {isEn
            ? 'Quick entry points to our collections — similar to a department store home.'
            : 'Accesos rápidos a nuestras colecciones — estilo tienda por departamentos.'}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {blocks.map((c) => (
          <section id={c.id} key={c.id} className="scroll-mt-28 rounded-none border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-stone-900">{c.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{c.body}</p>
            <Link
              to={c.to}
              className="mt-4 inline-flex text-sm font-semibold text-stone-900 underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900"
            >
              {isEn ? 'Shop now' : 'Ver productos'}
            </Link>
          </section>
        ))}
      </div>
    </div>
  )
}
