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
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ¡Bienvenido, {user?.nombre?.split(' ')[0] || 'Usuario'}!
          </h1>
          <p className="text-slate-500 mt-1">
            Aquí tienes un resumen de la información del sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/locations/new">
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Ubicación
            </Button>
          </Link>
          <Link href="/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ubicaciones"
          value={totalLocations.toLocaleString('es-PA')}
          icon={Building2}
          description="Registradas en el sistema"
          trend={{ value: 15, isPositive: true }}
          onClick={() => {}}
        />
        <StatCard
          title="Volumen Total"
          value={`${totalVolume.toLocaleString('es-PA')} m³`}
          icon={Package}
          description="≈ ${(totalVolume * 0.001).toFixed(1)} millones de litros"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Peso Estimado"
          value={`${totalWeight.toLocaleString('es-PA')} kg`}
          icon={Weight}
          description={`≈ ${(totalWeight / 1000).toFixed(1)} toneladas`}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Valor Total"
          value={`$${totalValue.toLocaleString('es-PA')}`}
          icon={DollarSign}
          description="Costo estimado"
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/map">
          <Card className="hover:border-emerald-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Ver Mapa</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Visualiza todas las ubicaciones en el mapa interactivo
                  </p>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm mt-3">
                    Ir al mapa <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/locations">
          <Card className="hover:border-emerald-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Ver Ubicaciones</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Lista completa de todas las instituciones registradas
                  </p>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm mt-3">
                    Ver lista <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/import">
          <Card className="hover:border-emerald-300 transition-colors cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Upload className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">Importar Datos</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Carga masiva de ubicaciones desde Excel o CSV
                  </p>
                  <div className="flex items-center gap-1 text-emerald-600 text-sm mt-3">
                    Importar <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Actividad Reciente</CardTitle>
          <Link href="/audit">
            <Button variant="ghost" size="sm" className="text-emerald-600">
              Ver todo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!auditLoading && (!auditLogs || auditLogs.length === 0) ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <ClipboardList className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No hay actividad reciente</p>
              <p className="text-sm text-gray-400">
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
  )
}
