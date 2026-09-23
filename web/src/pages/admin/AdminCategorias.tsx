import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import type { ApiLang } from '../../lib/api'
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from '../../lib/api'

const PAGE = 12

export function AdminCategorias() {
  const qc = useQueryClient()
  const [langFilter, setLangFilter] = useState<'' | ApiLang>('')
  const [page, setPage] = useState(0)

  const q = useQuery({
    queryKey: ['admin', 'categories', langFilter || 'all'],
    queryFn: () => adminListCategories(langFilter || undefined),
  })

  const [editingId, setEditingId] = useState<number | null>(null)
  const [draft, setDraft] = useState({ des_category: '', language: 'ESPA' as ApiLang })
  const [creating, setCreating] = useState(false)

  const save = useMutation({
    mutationFn: (args: { id: number; des_category: string; language: ApiLang }) =>
      adminUpdateCategory(args.id, { des_category: args.des_category, language: args.language }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setEditingId(null)
    },
  })

  const del = useMutation({
    mutationFn: (id: number) => adminDeleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  })

  const create = useMutation({
    mutationFn: () => adminCreateCategory({ des_category: draft.des_category, language: draft.language }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setCreating(false)
      setDraft({ des_category: '', language: 'ESPA' })
    },
  })

  const rows = q.data || []
  const pageRows = useMemo(() => rows.slice(page * PAGE, page * PAGE + PAGE), [rows, page])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-none bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Nueva categoría
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-none border px-3 py-1 text-xs ${langFilter === '' ? 'border-zinc-900 bg-zinc-900 text-white' : ''}`}
          onClick={() => {
            setLangFilter('')
            setPage(0)
          }}
        >
          Todos
        </button>
        <button
          type="button"
          className={`rounded-none border px-3 py-1 text-xs ${langFilter === 'ESPA' ? 'border-zinc-900 bg-zinc-900 text-white' : ''}`}
          onClick={() => {
            setLangFilter('ESPA')
            setPage(0)
          }}
        >
          ESPA
        </button>
        <button
          type="button"
          className={`rounded-none border px-3 py-1 text-xs ${langFilter === 'ENGL' ? 'border-zinc-900 bg-zinc-900 text-white' : ''}`}
          onClick={() => {
            setLangFilter('ENGL')
            setPage(0)
          }}
        >
          ENGL
        </button>
      </div>

      {q.isLoading ? <p className="text-sm text-zinc-600">Cargando…</p> : null}

      <div className="overflow-x-auto rounded-none border border-zinc-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Idioma</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id_category} className="border-b border-zinc-100">
                <td className="px-4 py-3 font-mono text-xs">{c.id_category}</td>
                <td className="px-4 py-3">
                  {editingId === c.id_category ? (
                    <input
                      className="w-full rounded-none border px-2 py-1"
                      value={draft.des_category}
                      onChange={(e) => setDraft((d) => ({ ...d, des_category: e.target.value }))}
                    />
                  ) : (
                    c.des_category
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === c.id_category ? (
                    <select
                      className="rounded-none border px-2 py-1"
                      value={draft.language}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, language: e.target.value as ApiLang }))
                      }
                    >
                      <option value="ESPA">ESPA</option>
                      <option value="ENGL">ENGL</option>
                    </select>
                  ) : (
                    c.language
                  )}
                </td>
                <td className="space-x-2 px-4 py-3 text-right whitespace-nowrap">
                  {editingId === c.id_category ? (
                    <>
                      <button
                        type="button"
                        className="text-xs font-semibold text-zinc-900"
                        onClick={() =>
                          save.mutate({
                            id: c.id_category,
                            des_category: draft.des_category,
                            language: draft.language,
                          })
                        }
                      >
                        Guardar
                      </button>
                      <button type="button" className="text-xs text-zinc-600" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="text-xs font-semibold text-zinc-900"
                        onClick={() => {
                          setEditingId(c.id_category)
                          setDraft({ des_category: c.des_category, language: c.language })
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-700"
                        onClick={() => {
                          if (confirm('¿Eliminar categoría?')) del.mutate(c.id_category)
                        }}
                      >
                        Borrar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          disabled={page <= 0}
          className="rounded-none border px-3 py-1 disabled:opacity-40"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Anterior
        </button>
        <span>
          Página {page + 1} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages - 1}
          className="rounded-none border px-3 py-1 disabled:opacity-40"
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
        >
          Siguiente
        </button>
      </div>

      {creating ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-none border border-zinc-200 bg-white p-6">
            <h2 className="text-lg font-semibold">Nueva categoría</h2>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm">
                Nombre
                <input
                  className="rounded-none border px-3 py-2"
                  value={draft.des_category}
                  onChange={(e) => setDraft((d) => ({ ...d, des_category: e.target.value }))}
                />
              </label>
              <label className="grid gap-1 text-sm">
                Idioma
                <select
                  className="rounded-none border px-3 py-2"
                  value={draft.language}
                  onChange={(e) => setDraft((d) => ({ ...d, language: e.target.value as ApiLang }))}
                >
                  <option value="ESPA">ESPA</option>
                  <option value="ENGL">ENGL</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded-none border px-4 py-2 text-sm" onClick={() => setCreating(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-none bg-zinc-900 px-4 py-2 text-sm text-white"
                onClick={() => create.mutate()}
                disabled={!draft.des_category.trim()}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
