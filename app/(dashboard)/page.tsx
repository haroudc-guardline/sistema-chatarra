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

      {/* Quick Actions - Diseño Moderno 2026 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/map">
          <Card className="group bg-gradient-to-br from-blue-600/10 to-blue-800/5 backdrop-blur-md border-blue-200/50 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-400/50 transition-all duration-300 cursor-pointer h-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-blue-700 transition-colors">Ver Mapa</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Visualiza todas las ubicaciones en el mapa interactivo
                  </p>
                  <div className="flex items-center gap-1 text-blue-700 text-sm mt-3 font-medium group-hover:gap-2 transition-all">
                    Ir al mapa <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/locations">
          <Card className="group bg-gradient-to-br from-red-600/10 to-red-800/5 backdrop-blur-md border-red-200/50 hover:shadow-xl hover:shadow-red-500/10 hover:border-red-400/50 transition-all duration-300 cursor-pointer h-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/5 to-red-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-red-700 transition-colors">Ver Ubicaciones</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Lista completa de todas las instituciones registradas
                  </p>
                  <div className="flex items-center gap-1 text-red-700 text-sm mt-3 font-medium group-hover:gap-2 transition-all">
                    Ver lista <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import">
          <Card className="group bg-gradient-to-br from-purple-600/10 to-purple-800/5 backdrop-blur-md border-purple-200/50 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-400/50 transition-all duration-300 cursor-pointer h-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800 group-hover:text-purple-700 transition-colors">Importar Datos</h3>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                    Carga masiva de ubicaciones desde Excel o CSV
                  </p>
                  <div className="flex items-center gap-1 text-purple-700 text-sm mt-3 font-medium group-hover:gap-2 transition-all">
                    Importar <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
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
