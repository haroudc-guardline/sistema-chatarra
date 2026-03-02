'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useLocation, useLocations } from '@/hooks/useLocations'
import { useAuth } from '@/hooks/useAuth'
import { MapComponent } from '@/components/map/MapComponent'
import { DataTable } from '@/components/data/DataTable'
import { WasteItemManager } from '@/components/waste/WasteItemManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Package,
  Weight,
  DollarSign,
  User,
  Phone,
} from 'lucide-react'
import { auditService } from '@/lib/services/audit-service'
import type { AuditLog } from '@/types/database'

export default function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isOperador, isAdmin } = useAuth()
  const locationId = parseInt(params.id as string)
  const { location, isLoading } = useLocation(locationId)
  const { deleteLocation, isDeleting } = useLocations() // <-- Añadido
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [auditLoading, setAuditLoading] = useState(true)

  useEffect(() => {
    if (locationId) {
      auditService.getEntityAuditLogs('locations', locationId)
        .then(setAuditLogs)
        .finally(() => setAuditLoading(false))
    }
  }, [locationId])

  const handleDelete = async () => {
    await deleteLocation(locationId)
    router.push('/locations')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-slate-900">Ubicación no encontrada</h1>
        <p className="text-slate-500 mt-2">La ubicación que buscas no existe o ha sido eliminada.</p>
        <Link href="/locations">
          <Button className="mt-4">Volver a Ubicaciones</Button>
        </Link>
      </div>
    )
  }

  const auditColumns = [
    {
      key: 'action',
      header: 'Acción',
      cell: (log: AuditLog) => (
        <Badge
          variant={
            log.action === 'CREATE'
              ? 'default'
              : log.action === 'UPDATE'
              ? 'secondary'
              : 'destructive'
          }
        >
          {log.action}
        </Badge>
      ),
    },
    {
      key: 'user',
      header: 'Usuario',
      cell: (log: AuditLog) => (
        <span>{(log as unknown as { profiles?: { nombre: string } }).profiles?.nombre || 'Sistema'}</span>
      ),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      cell: (log: AuditLog) => (
        <span className="text-sm text-slate-500">
          {new Date(log.created_at).toLocaleString('es-PA')}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/locations">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{location.nombre_institucion}</h1>
            <p className="text-slate-500 flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {location.direccion}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isOperador && (
            <Link href={`/locations/${location.id}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Ciudad</p>
                  <p className="font-medium">{location.ciudad}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Municipio</p>
                  <p className="font-medium">{location.municipio}</p>
                </div>
                {location.corregimiento && (
                  <div>
                    <p className="text-sm text-slate-500">Corregimiento</p>
                    <p className="font-medium">{location.corregimiento}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm text-slate-500">Volumen</p>
                    <p className="font-medium">{location.volumen} m³</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm text-slate-500">Peso</p>
                    <p className="font-medium">{location.peso_estimado} kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm text-slate-500">Valor</p>
                    <p className="font-medium">${location.costo_valor}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Responsable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                <span>{location.nombre_responsable}</span>
              </div>
              {location.telefono_responsable && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{location.telefono_responsable}</span>
                </div>
              )}
              {location.email_responsable && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href={`mailto:${location.email_responsable}`} className="text-blue-600 hover:underline">
                    {location.email_responsable}
                  </a>
                </div>
              )}
              {!location.telefono_responsable && !location.email_responsable && location.contacto_responsable && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{location.contacto_responsable}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <WasteItemManager 
            locationId={location.id} 
            wasteTypes={location.waste_types || []} 
          />

          {location.documents && location.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {location.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <span className="text-sm">{doc.file_name}</span>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer">
                          Ver
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Map & Audit */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ubicación en el Mapa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] rounded-lg overflow-hidden">
                <MapComponent
                  locations={[location]}
                  height="100%"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500">Latitud</p>
                  <p className="font-mono">{location.latitud}</p>
                </div>
                <div>
                  <p className="text-slate-500">Longitud</p>
                  <p className="font-mono">{location.longitud}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de Cambios</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={auditLogs}
                columns={auditColumns}
                isLoading={auditLoading}
                keyExtractor={(log) => log.id}
                emptyMessage="No hay historial de cambios"
                pageSize={5}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la ubicación &quot;{location.nombre_institucion}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
