import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { QuotesByStoreItem } from '../../lib/api'
import { adminQuotesByStore, adminStats } from '../../lib/api'

const DONUT_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
]

function currentMonthYm() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  if (!y || !m) return ym
  try {
    return new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
  } catch {
    return ym
  }
}

function computeKpis(items: QuotesByStoreItem[], totalMonth: number) {
  const active = items.filter((i) => i.count > 0)
  const totalBranches = items.length
  const activeBranches = active.length
  const sorted = [...items].sort((a, b) => b.count - a.count)
  const top = sorted[0]
  const shareTop =
    totalMonth > 0 && top && top.count > 0 ? Math.round((top.count / totalMonth) * 100) : 0
  const avgPerActive =
    activeBranches > 0 ? Math.round((totalMonth / activeBranches) * 10) / 10 : null
  return { activeBranches, totalBranches, top, shareTop, avgPerActive }
}

type KpiCardProps = {
  label: string
  value: string | number
  hint?: string
  accent: 'violet' | 'cyan' | 'amber' | 'emerald'
}

const accentRing: Record<KpiCardProps['accent'], string> = {
  violet: 'from-violet-500/20 to-indigo-500/10 ring-violet-200/80',
  cyan: 'from-cyan-500/20 to-sky-500/10 ring-cyan-200/80',
  amber: 'from-amber-500/20 to-orange-500/10 ring-amber-200/80',
  emerald: 'from-emerald-500/20 to-teal-500/10 ring-emerald-200/80',
}

function KpiCard({ label, value, hint, accent }: KpiCardProps) {
  return (
    <div
      className={`rounded-none bg-gradient-to-br p-4 ring-1 ring-inset shadow-sm backdrop-blur-sm ${accentRing[accent]}`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-zinc-900">{value}</div>
      {hint ? <div className="mt-1 text-xs leading-snug text-zinc-600">{hint}</div> : null}
    </div>
  )
}

export function AdminDashboard() {
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: adminStats })
  const [month, setMonth] = useState(currentMonthYm)
  const byStore = useQuery({
    queryKey: ['admin', 'stats', 'quotes-by-store', month],
    queryFn: () => adminQuotesByStore(month),
  })

  const chartData = useMemo(() => byStore.data?.items || [], [byStore.data?.items])
  const totalMonth = useMemo(() => chartData.reduce((s, r) => s + r.count, 0), [chartData])

  const pieData = useMemo(
    () =>
      chartData
        .filter((d) => d.count > 0)
        .map((d) => ({
          name: d.storeName,
          value: d.count,
          id_store: d.id_store,
        })),
    [chartData],
  )

  const kpis = useMemo(() => computeKpis(chartData, totalMonth), [chartData, totalMonth])

  return (
    <div className="grid gap-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      {q.isLoading ? <p className="text-sm text-zinc-600">Cargando métricas…</p> : null}
      {q.isError ? <p className="text-sm text-red-700">No se pudieron cargar las métricas.</p> : null}
      {q.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-none border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold uppercase text-zinc-500">Cotizaciones</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{q.data.totalQuotes}</div>
          </div>
          <div className="rounded-none border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold uppercase text-zinc-500">Pendientes / error</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{q.data.pendingQuotes}</div>
          </div>
          <div className="rounded-none border border-zinc-200/80 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="text-xs font-semibold uppercase text-zinc-500">Productos</div>
            <div className="mt-2 text-3xl font-semibold tabular-nums">{q.data.activeProducts}</div>
          </div>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-none border border-zinc-200/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60 p-6 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.12)] sm:p-8">
        <div className="flex flex-col gap-4 border-b border-zinc-200/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Distribución por sucursal</h2>
            <p className="mt-1 max-w-xl text-sm text-zinc-600">
              Donut interactivo del mes: proporción de cotizaciones por Tienda. Use el filtro para comparar meses.
            </p>
          </div>
          <label className="grid w-full gap-1.5 text-sm font-medium text-zinc-700 sm:w-auto sm:min-w-[200px]">
            Periodo (mes)
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="h-11 rounded-none border border-zinc-200 bg-white px-3 text-sm font-medium shadow-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
            />
          </label>
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-12">
          {/* Donut + centro KPI */}
          <div className="relative flex flex-col items-center lg:col-span-5">
            <div className="relative aspect-square w-full max-w-[min(100%,380px)]">
              {byStore.isLoading ? (
                <div className="flex h-[min(380px,70vw)] w-full items-center justify-center rounded-none border border-dashed border-zinc-200 bg-white/50 text-sm text-zinc-500">
                  Cargando…
                </div>
              ) : byStore.isError ? (
                <div className="flex h-[min(380px,70vw)] w-full items-center justify-center text-sm text-red-600">
                  No se pudo cargar el gráfico.
                </div>
              ) : pieData.length === 0 ? (
                <div className="flex h-[min(380px,70vw)] w-full flex-col items-center justify-center rounded-none border border-zinc-200 bg-white/60 text-center">
                  <div className="text-4xl font-bold tabular-nums text-zinc-300">0</div>
                  <div className="mt-2 text-sm text-zinc-500">Sin cotizaciones en {monthLabel(month)}</div>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.12" />
                        </filter>
                      </defs>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="62%"
                        outerRadius="88%"
                        paddingAngle={2.5}
                        cornerRadius={8}
                        stroke="#fff"
                        strokeWidth={3}
                        style={{ filter: 'url(#donutShadow)' }}
                      >
                        {pieData.map((d, i) => (
                          <Cell key={d.id_store} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value ?? 0}`, 'Cotizaciones']}
                        labelFormatter={(_, p) => (p?.[0]?.payload?.name != null ? String(p[0].payload.name) : '')}
                        contentStyle={{
                          borderRadius: 14,
                          border: '1px solid #e4e4e7',
                          boxShadow: '0 16px 48px rgba(15,23,42,0.14)',
                          padding: '12px 16px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Mes</div>
                      <div className="mt-0.5 text-sm font-medium capitalize text-zinc-700">{monthLabel(month)}</div>
                      <div className="mt-3 bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-4xl font-black tabular-nums text-transparent sm:text-5xl">
                        {totalMonth}
                      </div>
                      <div className="mt-1 text-xs font-medium text-zinc-500">cotizaciones</div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {pieData.length > 0 ? (
              <div className="mt-5 flex max-w-md flex-wrap justify-center gap-2 px-2">
                {pieData.map((d, i) => (
                  <span
                    key={d.id_store}
                    className="inline-flex items-center gap-2 rounded-none border border-zinc-200/90 bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-none ring-2 ring-white"
                      style={{ backgroundColor: DONUT_COLORS[i % DONUT_COLORS.length] }}
                    />
                    <span className="max-w-[140px] truncate">{d.name}</span>
                    <span className="tabular-nums text-zinc-500">({d.value})</span>
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {/* KPIs mes */}
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            <KpiCard
              accent="violet"
              label="Total del mes"
              value={totalMonth}
              hint="Líneas registradas en todas las sucursales."
            />
            <KpiCard
              accent="cyan"
              label="Sucursales activas"
              value={`${kpis.activeBranches} / ${kpis.totalBranches}`}
              hint="Tiendas con al menos una cotización en el mes."
            />
            <KpiCard
              accent="amber"
              label="Sucursal líder"
              value={
                kpis.top && kpis.top.count > 0
                  ? `${kpis.top.storeName.slice(0, 22)}${kpis.top.storeName.length > 22 ? '…' : ''}`
                  : '—'
              }
              hint={
                kpis.top && kpis.top.count > 0
                  ? `${kpis.top.count} cotiz. · ${kpis.shareTop}% del total`
                  : 'Sin actividad en el periodo.'
              }
            />
            <KpiCard
              accent="emerald"
              label="Promedio / sucursal activa"
              value={kpis.avgPerActive != null ? kpis.avgPerActive : '—'}
              hint="Total del mes ÷ sucursales con al menos una cotización."
            />
          </div>
        </div>
      </section>
    </div>
  )
}
