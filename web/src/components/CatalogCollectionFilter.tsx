import type { ProductCategory } from '../lib/api'

type Props = {
  categories: ProductCategory[] | undefined
  activeId: number | undefined
  onSelect: (id: number | undefined) => void
  isEn: boolean
  productCount: number
  title: string
}

export function CatalogCollectionFilter({
  categories,
  activeId,
  onSelect,
  isEn,
  productCount,
  title,
}: Props) {
  const activeLabel = categories?.find((c) => c.id_category === activeId)?.des_category

  return (
    <div className="border-b border-stone-200 pb-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-3xl tracking-tight text-stone-900 md:text-4xl">
          {activeLabel ?? title}
          <span className="ml-2 text-base font-sans text-stone-500">[{productCount}]</span>
        </h1>
      </div>

      <div className="mt-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-500">
          {isEn ? 'Collections' : 'Colecciones'}
          {categories?.length ? (
            <span className="ml-2 text-stone-400">[{categories.length}]</span>
          ) : null}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CollectionPill
            active={activeId == null}
            onClick={() => onSelect(undefined)}
            label={isEn ? 'All' : 'Todas'}
          />
          {categories?.map((c) => (
            <CollectionPill
              key={c.id_category}
              active={activeId === c.id_category}
              onClick={() => onSelect(c.id_category)}
              label={c.des_category}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function CollectionPill({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-none border px-4 py-2 text-xs font-medium transition ${
        active
          ? 'border-stone-900 bg-stone-900 text-white'
          : 'border-stone-300 bg-white text-stone-700 hover:border-stone-900'
      }`}
    >
      {label}
    </button>
  )
}
