'use client'

import { useAuth } from '@/hooks/useAuth'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Building2,
  Weight,
  DollarSign,
  Package,
  Leaf,
  Car,
  Wind,
  Wrench,
  Home,
  Map,
  Building,
  TrendingUp,
  Activity,
  MapPin,
  Cog,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)

const formatCompact = (value: number) =>
  value >= 1_000_000
    ? `$${(value / 1_000_000).toFixed(2)}M`
    : value >= 1_000
      ? `$${(value / 1_000).toFixed(1)}K`
      : formatCurrency(value)

// ── Hero KPI Card ────────────────────────────────────────────────────────────
interface HeroCardProps {
  label: string
  value: string
  subtitle: string
  icon: LucideIcon
  gradient: string
  isLoading: boolean
}

function HeroCard({ label, value, subtitle, icon: Icon, gradient, isLoading }: HeroCardProps) {
  return (
    <Card className={`relative overflow-hidden border-0 shadow-lg ${gradient} text-white`}>
      <CardContent className="p-5 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/80">{label}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mt-1 bg-white/20" />
            ) : (
              <p className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">{value}</p>
            )}
            <p className="text-xs text-white/70 mt-1">{subtitle}</p>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
      {/* Decorative circle */}
      <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/5" />
    </Card>
  )
}

// ── Stock Stat Card ──────────────────────────────────────────────────────────
interface StockStatCardProps {
  label: string
  count: number
  valor: number
  icon: LucideIcon
  color: string
  gradientFrom: string
  gradientTo: string
  borderColor: string
  shadowColor: string
  isLoading: boolean
  index: number
}

function StockStatCard({
  label,
  count,
  valor,
  icon: Icon,
  gradientFrom,
  gradientTo,
  borderColor,
  shadowColor,
  isLoading,
  index,
}: StockStatCardProps) {
  return (
    <Card
      className={`animate-stagger-${index + 1} group relative overflow-hidden bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-lg ${shadowColor} transition-all duration-300 hover:-translate-y-0.5 cursor-pointer`}
    >
      {/* Left accent border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${gradientFrom} ${gradientTo}`} />
      <CardContent className="p-4 pl-5 flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shrink-0 shadow-md ${shadowColor} group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          {isLoading ? (
            <>
              <Skeleton className="h-7 w-16 mt-1" />
              <Skeleton className="h-4 w-24 mt-1" />
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-sm text-slate-400 font-medium">{formatCurrency(valor)}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Descarte Stat Card ───────────────────────────────────────────────────────
interface DescarteStatCardProps {
  label: string
  value: string
  icon: LucideIcon
  gradientFrom: string
  gradientTo: string
  shadowColor: string
  isLoading: boolean
  index: number
}

function DescarteStatCard({
  label,
  value,
  icon: Icon,
  gradientFrom,
  gradientTo,
  shadowColor,
  isLoading,
  index,
}: DescarteStatCardProps) {
  return (
    <Card
      className={`animate-stagger-${index + 1} group relative overflow-hidden bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm hover:shadow-lg ${shadowColor} transition-all duration-300 hover:-translate-y-0.5 cursor-pointer`}
    >
      {/* Top accent border */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientFrom} ${gradientTo}`} />
      <CardContent className="p-4 pt-5 flex flex-col items-center text-center gap-3">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-md ${shadowColor} group-hover:scale-105 transition-transform duration-300`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          {isLoading ? (
            <Skeleton className="h-7 w-24 mt-1 mx-auto" />
          ) : (
            <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Chart Colors ─────────────────────────────────────────────────────────────
const CHART_COLORS = ['#1e40af', '#0d9488', '#f59e0b', '#dc2626', '#7c3aed']

// ── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()

  const stockCards = [
    {
      label: 'Vehiculos',
      count: stats?.stock.vehiculos.count ?? 0,
      valor: stats?.stock.vehiculos.valor ?? 0,
      icon: Car,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      borderColor: 'border-l-blue-500',
      shadowColor: 'hover:shadow-blue-500/15',
    },
    {
      label: 'A/C',
      count: stats?.stock.aires.count ?? 0,
      valor: stats?.stock.aires.valor ?? 0,
      icon: Wind,
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-teal-600',
      borderColor: 'border-l-teal-500',
      shadowColor: 'hover:shadow-teal-500/15',
    },
    {
      label: 'Herramientas',
      count: stats?.stock.herramientas.count ?? 0,
      valor: stats?.stock.herramientas.valor ?? 0,
      icon: Wrench,
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-orange-600',
      borderColor: 'border-l-orange-500',
      shadowColor: 'hover:shadow-orange-500/15',
    },
    {
      label: 'Fincas',
      count: stats?.stock.fincas.count ?? 0,
      valor: stats?.stock.fincas.valor ?? 0,
      icon: Home,
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      borderColor: 'border-l-emerald-500',
      shadowColor: 'hover:shadow-emerald-500/15',
    },
    {
      label: 'Terrenos',
      count: stats?.stock.terrenos.count ?? 0,
      valor: stats?.stock.terrenos.valor ?? 0,
      icon: Map,
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      borderColor: 'border-l-amber-500',
      shadowColor: 'hover:shadow-amber-500/15',
    },
    {
      label: 'Edificios',
      count: stats?.stock.edificios.count ?? 0,
      valor: stats?.stock.edificios.valor ?? 0,
      icon: Building,
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-purple-600',
      borderColor: 'border-l-purple-500',
      shadowColor: 'hover:shadow-purple-500/15',
    },
  ]

  const descarteCards = [
    {
      label: 'Total Ubicaciones',
      value: (stats?.descarte.ubicaciones ?? 0).toLocaleString('es-PA'),
      icon: Building2,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-indigo-600',
      shadowColor: 'hover:shadow-blue-500/15',
    },
    {
      label: 'Volumen Total',
      value: `${(stats?.descarte.volumen ?? 0).toLocaleString('es-PA')} m\u00B3`,
      icon: Package,
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-cyan-600',
      shadowColor: 'hover:shadow-teal-500/15',
    },
    {
      label: 'Peso Estimado',
      value: `${(stats?.descarte.peso ?? 0).toLocaleString('es-PA')} kg`,
      icon: Weight,
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-amber-600',
      shadowColor: 'hover:shadow-orange-500/15',
    },
    {
      label: 'Valor Total',
      value: formatCurrency(stats?.descarte.valor ?? 0),
      icon: DollarSign,
      gradientFrom: 'from-red-500',
      gradientTo: 'to-rose-600',
      shadowColor: 'hover:shadow-red-500/15',
    },
  ]

  const wasteChartData = (stats?.wasteByType ?? []).map((wt, i) => ({
    name: wt.nombre,
    value: wt.weight,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }))

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Background Layer - Animated gradient mesh */}
      <div className="fixed inset-0 z-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/40 to-teal-50/30" />

        {/* Animated mesh gradient orbs */}
        <div className="absolute inset-0 animate-gradient" style={{
          backgroundImage: `
            radial-gradient(at 20% 20%, hsla(217,91%,60%,0.12) 0px, transparent 50%),
            radial-gradient(at 80% 10%, hsla(174,72%,56%,0.10) 0px, transparent 50%),
            radial-gradient(at 70% 80%, hsla(217,91%,60%,0.08) 0px, transparent 50%),
            radial-gradient(at 10% 70%, hsla(160,76%,47%,0.10) 0px, transparent 50%),
            radial-gradient(at 50% 50%, hsla(240,60%,60%,0.05) 0px, transparent 60%)
          `,
          backgroundSize: '400% 400%',
        }} />

        {/* Subtle dot pattern for texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #1e40af 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            {user ? (
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Bienvenido, {user.nombre?.split(' ')[0] || 'Usuario'}!
              </h1>
            ) : (
              <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse" />
            )}
          </div>
          <p className="text-slate-600 text-base pl-[52px]">
            Panel de control — SIAE (Sistema Integral de Activos del Estado)
          </p>
        </div>

        {/* Hero Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HeroCard
            label="Valor Total de Activos"
            value={formatCompact(stats?.summary?.grandTotal ?? 0)}
            subtitle="Stock + Materiales de Descarte"
            icon={TrendingUp}
            gradient="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700"
            isLoading={isLoading}
          />
          <HeroCard
            label="Bienes en Stock"
            value={String(stats?.summary?.totalStockItems ?? 0)}
            subtitle={`Valorados en ${formatCompact(stats?.summary?.totalStockValue ?? 0)}`}
            icon={Package}
            gradient="bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700"
            isLoading={isLoading}
          />
          <HeroCard
            label="Items de Descarte"
            value={String(stats?.summary?.totalDescarteItems ?? 0)}
            subtitle={`en ${stats?.geography?.locations ?? 0} ubicaciones`}
            icon={BarChart3}
            gradient="bg-gradient-to-br from-amber-500 via-orange-600 to-red-600"
            isLoading={isLoading}
          />
        </div>

        {/* Inventario en Stock */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Inventario en Stock
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockCards.map((card, idx) => (
              <StockStatCard
                key={card.label}
                label={card.label}
                count={card.count}
                valor={card.valor}
                icon={card.icon}
                color=""
                gradientFrom={card.gradientFrom}
                gradientTo={card.gradientTo}
                borderColor={card.borderColor}
                shadowColor={card.shadowColor}
                isLoading={isLoading}
                index={idx}
              />
            ))}
          </div>
        </div>

        {/* Materiales de Descarte */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <h2 className="text-lg font-semibold text-slate-800">
              Materiales de Descarte
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {descarteCards.map((card, idx) => (
              <DescarteStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                gradientFrom={card.gradientFrom}
                gradientTo={card.gradientTo}
                shadowColor={card.shadowColor}
                isLoading={isLoading}
                index={idx}
              />
            ))}
          </div>
        </div>

        {/* Bottom Row: Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut Chart - Waste Distribution */}
          <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Distribución de Materiales</h3>
              </div>
              {isLoading ? (
                <div className="h-[220px] flex items-center justify-center">
                  <Skeleton className="h-40 w-40 rounded-full" />
                </div>
              ) : wasteChartData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="h-[220px] w-[220px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {wasteChartData.map((entry, index) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val) => [`${Number(val).toLocaleString('es-PA')} kg`, 'Peso']}
                          contentStyle={{
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            fontSize: '13px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {wasteChartData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <span className="text-slate-600 truncate">{item.name}</span>
                        <span className="ml-auto font-medium text-slate-800 whitespace-nowrap">
                          {item.value.toLocaleString('es-PA')} kg
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Sin datos de materiales
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity & Geography Panel */}
          <Card className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-slate-500" />
                <h3 className="font-semibold text-slate-800">Resumen del Sistema</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Activity Stats */}
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Actividad</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-slate-900">{stats?.activity?.total ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">acciones registradas</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-emerald-600 font-medium">+{stats?.activity?.creates ?? 0} creados</span>
                        <span className="text-xs text-blue-600 font-medium">{stats?.activity?.updates ?? 0} actualizados</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Geographic Coverage */}
                <div className="rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-teal-600" />
                    <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Cobertura</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-slate-900">{stats?.geography?.locations ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">ubicaciones</p>
                      <div className="flex gap-3 mt-2">
                        <span className="text-xs text-teal-600 font-medium">{stats?.geography?.cities ?? 0} ciudades</span>
                        <span className="text-xs text-emerald-600 font-medium">{stats?.geography?.municipios ?? 0} municipios</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Parts Bank */}
                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Cog className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Banco Piezas</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-slate-900">{stats?.parts?.total ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">piezas registradas</p>
                    </>
                  )}
                </div>

                {/* Waste Types Count */}
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 border border-purple-100/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Leaf className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Categorías</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-6 w-16" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-slate-900">{stats?.wasteByType?.length ?? 0}</p>
                      <p className="text-xs text-slate-500 mt-1">tipos de material</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
