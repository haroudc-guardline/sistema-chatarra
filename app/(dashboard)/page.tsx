'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { useAudit } from '@/hooks/useAudit'
import { StatCard } from '@/components/data/StatCard'
import { DataTable } from '@/components/data/DataTable'
import { DashboardSkeleton } from '@/components/feedback/Skeletons'
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
} from 'lucide-react'
import type { AuditLog } from '@/types/database'

export default function DashboardPage() {
  const { user } = useAuth()
  const { locations, isLoading: locationsLoading } = useLocations()
  const { auditLogs, isLoading: auditLoading } = useAudit({ limit: 5 })

  // Show skeleton while loading
  if (locationsLoading) {
    return <DashboardSkeleton />
  }

  // Calculate stats
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
    <div className="space-y-6 relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-blue-50/95 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10 space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-950 to-blue-800 bg-clip-text text-transparent">
            ¡Bienvenido, {user?.nombre?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p className="text-slate-600 mt-1 text-lg">
            Aquí tienes un resumen de la información del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/locations/new">
            <Button className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Ubicación
            </Button>
          </Link>
          <Link href="/import">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats - Sin indicadores de tendencia */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ubicaciones"
          value={totalLocations.toLocaleString('es-PA')}
          icon={Building2}
          description="Registradas en el sistema"
          onClick={() => {}}
        />
        <StatCard
          title="Volumen Total"
          value={`${totalVolume.toLocaleString('es-PA')} m³`}
          icon={Package}
          description={`≈ ${(totalVolume * 0.001).toFixed(1)} millones de litros`}
        />
        <StatCard
          title="Peso Estimado"
          value={`${totalWeight.toLocaleString('es-PA')} kg`}
          icon={Weight}
          description={`≈ ${(totalWeight / 1000).toFixed(1)} toneladas`}
        />
        <StatCard
          title="Valor Total"
          value={`$${totalValue.toLocaleString('es-PA')}`}
          icon={DollarSign}
          description="Costo estimado"
        />
      </div>

      {/* Quick Actions - Diseño Vertical con Iconos Arriba */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/map">
          <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full">
            {/* Background Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900" />
            <div 
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=1000&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                <MapPin className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3 group-hover:scale-105 transition-transform">Ver Mapa</h3>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Visualiza todas las ubicaciones en el mapa interactivo con filtros avanzados
              </p>
              <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors">
                Explorar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/locations">
          <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full">
            {/* Background Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-700 to-red-900" />
            <div 
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1000&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                <Building2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3 group-hover:scale-105 transition-transform">Ver Ubicaciones</h3>
              <p className="text-red-100 text-sm leading-relaxed mb-6">
                Lista completa de instituciones con detalles de residuos y documentos
              </p>
              <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors">
                Ver lista <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import">
          <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full">
            {/* Background Image */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900" />
            <div 
              className="absolute inset-0 opacity-20 mix-blend-overlay"
              style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1000&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}
            />
            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl">
                <Upload className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3 group-hover:scale-105 transition-transform">Importar Datos</h3>
              <p className="text-purple-100 text-sm leading-relaxed mb-6">
                Carga masiva de ubicaciones desde archivos Excel o CSV de forma rápida
              </p>
              <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors">
                Importar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-slate-800">Actividad Reciente</CardTitle>
          <Link href="/audit">
            <Button variant="ghost" size="sm" className="text-red-700 hover:bg-red-50">
              Ver todo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!auditLoading && (!auditLogs || auditLogs.length === 0) ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-slate-500 mb-2">No hay actividad reciente</p>
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
