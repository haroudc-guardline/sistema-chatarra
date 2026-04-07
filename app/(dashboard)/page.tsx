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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)

interface StockStatCardProps {
  label: string
  count: number
  valor: number
  icon: LucideIcon
  color: string
  bgColor: string
  isLoading: boolean
}

function StockStatCard({
  label,
  count,
  valor,
  icon: Icon,
  color,
  bgColor,
  isLoading,
}: StockStatCardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          {isLoading ? (
            <>
              <Skeleton className="h-6 w-16 mt-1" />
              <Skeleton className="h-3 w-24 mt-1.5" />
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-900">{count}</p>
              <p className="text-xs text-slate-400">{formatCurrency(valor)}</p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface DescarteStatCardProps {
  label: string
  value: string
  icon: LucideIcon
  color: string
  bgColor: string
  isLoading: boolean
}

function DescarteStatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
  isLoading,
}: DescarteStatCardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-20 mt-1" />
          ) : (
            <p className="text-lg font-semibold text-slate-900">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: stats, isLoading } = useDashboardStats()

  const stockCards = [
    {
      label: 'Vehiculos',
      count: stats?.stock.vehiculos.count ?? 0,
      valor: stats?.stock.vehiculos.valor ?? 0,
      icon: Car,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'A/C',
      count: stats?.stock.aires.count ?? 0,
      valor: stats?.stock.aires.valor ?? 0,
      icon: Wind,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      label: 'Herramientas',
      count: stats?.stock.herramientas.count ?? 0,
      valor: stats?.stock.herramientas.valor ?? 0,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Fincas',
      count: stats?.stock.fincas.count ?? 0,
      valor: stats?.stock.fincas.valor ?? 0,
      icon: Home,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Terrenos',
      count: stats?.stock.terrenos.count ?? 0,
      valor: stats?.stock.terrenos.valor ?? 0,
      icon: Map,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      label: 'Edificios',
      count: stats?.stock.edificios.count ?? 0,
      valor: stats?.stock.edificios.valor ?? 0,
      icon: Building,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ]

  const descarteCards = [
    {
      label: 'Total Ubicaciones',
      value: (stats?.descarte.ubicaciones ?? 0).toLocaleString('es-PA'),
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Volumen Total',
      value: `${(stats?.descarte.volumen ?? 0).toLocaleString('es-PA')} m\u00B3`,
      icon: Package,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      label: 'Peso Estimado',
      value: `${(stats?.descarte.peso ?? 0).toLocaleString('es-PA')} kg`,
      icon: Weight,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      label: 'Valor Total',
      value: formatCurrency(stats?.descarte.valor ?? 0),
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Background Layer - Fixed with Industrial/Recycling Theme */}
      <div className="fixed inset-0 z-0">
        {/* High-quality background image - Modern recycling facility */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2940&auto=format&fit=crop")`,
          }}
        />

        {/* Multi-layer gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-blue-50/85" />

        {/* Additional ambient gradient */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, hsla(217,91%,60%,0.1) 0px, transparent 50%),
              radial-gradient(at 100% 0%, hsla(160,76%,47%,0.1) 0px, transparent 50%),
              radial-gradient(at 100% 100%, hsla(210,100%,56%,0.08) 0px, transparent 50%),
              radial-gradient(at 0% 100%, hsla(150,60%,45%,0.08) 0px, transparent 50%)
            `,
          }}
        />

        {/* Subtle pattern overlay for texture */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
            Panel de control del Sistema de Inventario Nacional de Bienes Patrimoniales
          </p>
        </div>

        {/* Inventario en Stock */}
        <div className="space-y-4">
          <div className="border-b border-slate-200/60 pb-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Inventario en Stock
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockCards.map((card) => (
              <StockStatCard
                key={card.label}
                label={card.label}
                count={card.count}
                valor={card.valor}
                icon={card.icon}
                color={card.color}
                bgColor={card.bgColor}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>

        {/* Materiales de Descarte */}
        <div className="space-y-4">
          <div className="border-b border-slate-200/60 pb-2">
            <h2 className="text-lg font-semibold text-slate-800">
              Materiales de Descarte
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {descarteCards.map((card) => (
              <DescarteStatCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                color={card.color}
                bgColor={card.bgColor}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
