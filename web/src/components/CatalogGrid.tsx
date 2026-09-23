import { Link } from 'react-router-dom'
import { assetUrl, type Product } from '../lib/api'

type Props = {
  products: Product[] | undefined
  isEn: boolean
  emptyMessage?: string
}

export function CatalogGrid({ products, isEn, emptyMessage }: Props) {
  if (!products?.length) {
    return (
      <p className="py-16 text-center text-sm text-stone-500">
        {emptyMessage ?? (isEn ? 'No products in this collection.' : 'No hay productos en esta colección.')}
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
      {products.map((p) => (
        <li key={p.id_product}>
          <Link to={`/productos/${p.id_product}`} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
              {p.img_path_name ? (
                <img
                  src={assetUrl(p.img_path_name) || ''}
                  alt={p.name_product || ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-stone-100 to-stone-200">
                  <span className="font-serif text-5xl text-stone-400/80">{(p.name_product || '?').charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">{p.category?.des_category}</p>
              <h3 className="text-sm font-medium leading-snug text-stone-900 group-hover:underline underline-offset-4">
                {p.name_product}
              </h3>
              <p className="text-sm text-stone-600">
                {p.amount != null
                  ? `${isEn ? 'From' : 'Desde'} ₡${p.amount}`
                  : isEn
                    ? 'View product'
                    : 'Ver producto'}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
