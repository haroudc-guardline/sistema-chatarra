'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { useAudit } from '@/hooks/useAudit'
import { StatCard } from '@/components/data/StatCard'
import { DataTable } from '@/components/data/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  Weight,
  DollarSign,
  Package,
  Plus,
  Upload,
  MapPin,
  ArrowRight,
  ClipboardList,
  TrendingUp,
  Recycle,
  Leaf,
} from 'lucide-react'
import type { AuditLog } from '@/types/database'

export default function DashboardPage() {
  const { user } = useAuth()
  const { locations, isLoading: locationsLoading } = useLocations()
  const { auditLogs, isLoading: auditLoading } = useAudit({ limit: 5 })

  // Calculate stats (0 while loading — StatCard handles its own skeleton via isLoading prop)
  const totalLocations = locations?.length || 0
  const totalVolume = locations?.reduce((sum, loc) => sum + (loc.volumen || 0), 0) || 0
  const totalWeight = locations?.reduce((sum, loc) => sum + (loc.peso_estimado || 0), 0) || 0
  const totalValue = locations?.reduce((sum, loc) => sum + (loc.costo_valor || 0), 0) || 0

  const recentActivityColumns = [
    {
      key: 'action',
      header: 'Acción',
      cell: (log: AuditLog) => (
        <span className="capitalize font-medium text-slate-700">
          {log.action.toLowerCase()}
        </span>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entidad',
      cell: (log: AuditLog) => (
        <span className="text-slate-600">
          {log.entity_type === 'locations' ? 'Ubicación' : log.entity_type}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'Usuario',
      cell: (log: AuditLog) => (
        <span className="text-slate-600">
          {(log as unknown as { profiles?: { nombre: string } }).profiles?.nombre || 'Sistema'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      cell: (log: AuditLog) => (
        <span className="text-slate-500 text-sm">
          {new Date(log.created_at).toLocaleString('es-PA', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </span>
      ),
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              {user ? (
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                  ¡Bienvenido, {user.nombre?.split(' ')[0] || 'Usuario'}!
                </h1>
              ) : (
                <div className="h-8 w-56 bg-slate-200 rounded-lg animate-pulse" />
              )}
            </div>
            <p className="text-slate-600 text-base pl-[52px]">
              Panel de control del Sistema Nacional de Residuos de Panamá
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/locations/new">
              <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 transition-all duration-300 border-0">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Ubicación
              </Button>
            </Link>
            <Link href="/import">
              <Button variant="outline" className="bg-white/70 backdrop-blur-sm hover:bg-white border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
                <Upload className="mr-2 h-4 w-4" />
                Importar
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Ubicaciones"
            value={totalLocations.toLocaleString('es-PA')}
            icon={Building2}
            description="Registradas en el sistema"
            color="blue"
            isLoading={locationsLoading}
          />
          <StatCard
            title="Volumen Total"
            value={`${totalVolume.toLocaleString('es-PA')} m³`}
            icon={Package}
            description="Registrado en el sistema"
            color="emerald"
            isLoading={locationsLoading}
          />
          <StatCard
            title="Peso Estimado"
            value={`${totalWeight.toLocaleString('es-PA')} kg`}
            icon={Weight}
            description={`≈ ${(totalWeight / 1000).toFixed(1)} toneladas`}
            color="amber"
            isLoading={locationsLoading}
          />
          <StatCard
            title="Valor Total"
            value={`$${totalValue.toLocaleString('es-PA')}`}
            icon={DollarSign}
            description="Costo estimado"
            color="rose"
            isLoading={locationsLoading}
          />
        </div>

        {/* Quick Actions Cards with High-Quality Background Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/map" className="group">
            <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group-hover:-translate-y-1">
              {/* Background image - Aerial/Map view */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url("https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop")`,
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 via-blue-700/85 to-indigo-900/90" />
              
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-blue-400/20 blur-xl" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white">
                <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-white/30">
                  <MapPin className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-bold text-2xl mb-3">Ver Mapa</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  Visualiza todas las ubicaciones en el mapa interactivo con filtros avanzados
                </p>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors border border-white/20">
                  Explorar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/locations" className="group">
            <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group-hover:-translate-y-1">
              {/* Background image - Industrial/Warehouse */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")`,
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-emerald-700/85 to-teal-900/90" />
              
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white">
                <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-white/30">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-bold text-2xl mb-3">Ver Ubicaciones</h3>
                <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                  Lista completa de instituciones con detalles de residuos y documentos
                </p>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors border border-white/20">
                  Ver lista <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/import" className="group">
            <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group-hover:-translate-y-1">
              {/* Background image - Data/Technology */}
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url("https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop")`,
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/90 via-purple-700/85 to-fuchsia-900/90" />
              
              {/* Decorative elements */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-purple-400/20 blur-xl" />
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white">
                <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-white/30">
                  <Upload className="h-10 w-10 text-white" />
                </div>
                <h3 className="font-bold text-2xl mb-3">Importar Datos</h3>
                <p className="text-purple-100 text-sm leading-relaxed mb-6">
                  Carga masiva de ubicaciones desde archivos Excel o CSV de forma rápida
                </p>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors border border-white/20">
                  Importar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                <ClipboardList className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-slate-800 text-lg">Actividad Reciente</CardTitle>
            </div>
            <Link href="/audit">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Ver todo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {!auditLoading && (!auditLogs || auditLogs.length === 0) ? (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <ClipboardList className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">No hay actividad reciente</p>
                <p className="text-sm text-slate-400">
                  Los cambios realizados en ubicaciones y usuarios aparecerán aquí
                </p>
              </div>
            ) : (
              <DataTable
                data={auditLogs}
                columns={recentActivityColumns}
                isLoading={auditLoading}
                keyExtractor={(log) => log.id}
                emptyMessage="No hay actividad reciente"
                pageSize={5}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
