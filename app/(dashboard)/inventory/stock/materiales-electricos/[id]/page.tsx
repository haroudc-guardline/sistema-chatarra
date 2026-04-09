'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { stockItemService } from '@/lib/services/stock-item-service'
import { useAuth } from '@/hooks/useAuth'
import { useLocations } from '@/hooks/useLocations'
import { useElectronicMutations } from '@/hooks/useStockItems'
import { AddElectronicDialog } from '@/components/forms/AddElectronicDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Loader2, Pencil, Trash2, MapPin, Laptop, ArrowLeft,
} from 'lucide-react'
import type { StockElectronic } from '@/types/database'

const ESTADO_COLORS: Record<string, string> = {
  'Operativo': 'bg-emerald-100 text-emerald-800',
  'En reparación': 'bg-yellow-100 text-yellow-800',
  'Fuera de servicio': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value ?? '—'}</p>
    </div>
  )
}

export default function ElectronicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isAdmin, isOperador } = useAuth()
  const { locations } = useLocations()
  const { remove } = useElectronicMutations()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const { data: item, isLoading, error, refetch } = useQuery({
    queryKey: ['stockElectronic', id],
    queryFn: () => stockItemService.getElectronic(Number(id)),
  })

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value)
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este equipo electrónico?')) return
    await remove.mutateAsync(Number(id))
    router.push('/inventory/stock/materiales-electricos')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Cargando equipo electrónico...</span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="text-center py-24">
        <Laptop className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Equipo electrónico no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/inventory/stock/materiales-electricos')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.nombre}
        description={[item.marca, item.modelo].filter(Boolean).join(' ') || undefined}
        breadcrumbs={[
          { label: 'Inventario', href: '/inventory' },
          { label: 'Inventario General en Stock', href: '/inventory/stock' },
          { label: 'Materiales Eléctricos', href: '/inventory/stock/materiales-electricos' },
          { label: item.nombre },
        ]}
        actions={
          (isAdmin || isOperador) ? [
            {
              label: 'Editar',
              icon: Pencil,
              variant: 'outline' as const,
              onClick: () => setEditDialogOpen(true),
            },
            {
              label: 'Eliminar',
              icon: Trash2,
              variant: 'outline' as const,
              onClick: handleDelete,
            },
          ] : undefined
        }
      />

      <div className="flex items-center gap-3 mb-2">
        <Badge className={`text-sm px-3 py-1 ${ESTADO_COLORS[item.estado] || 'bg-slate-100 text-slate-700'}`}>
          {item.estado}
        </Badge>
        {item.codigo_marbete && (
          <span className="text-sm text-slate-500">Marbete: <span className="font-mono font-medium text-slate-700">{item.codigo_marbete}</span></span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información del Equipo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información del Equipo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Nombre" value={item.nombre} />
            <DetailField label="Tipo Electrónico" value={item.tipo_electronico} />
            <DetailField label="Marca" value={item.marca} />
            <DetailField label="Modelo" value={item.modelo} />
            <DetailField label="Número de Serie" value={item.numero_serie} />
            <DetailField label="Sistema Operativo" value={item.sistema_operativo} />
            <DetailField label="Tipo de Activo" value={item.tipo_activo} />
          </CardContent>
        </Card>

        {/* Ubicación e Institución */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              Ubicación e Institución
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Institución" value={item.location?.nombre_institucion} />
            <DetailField label="Ciudad" value={item.location?.ciudad} />
            <DetailField label="Municipio" value={item.location?.municipio} />
            <DetailField label="Ubicación" value={item.ubicacion_nombre} />
            <div className="col-span-2">
              <DetailField label="Dirección" value={item.ubicacion_direccion} />
            </div>
          </CardContent>
        </Card>

        {/* Fechas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fechas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Fecha Adquisición" value={formatDate(item.fecha_adquisicion)} />
            <DetailField label="Fecha Garantía" value={formatDate(item.fecha_garantia)} />
            <DetailField label="Frecuencia Mantenimiento" value={item.frecuencia_mantenimiento} />
          </CardContent>
        </Card>

        {/* Valor y Responsable */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Valor y Responsable</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailField label="Valor" value={formatCurrency(item.valor)} />
            <DetailField label="Tiene Avalúo" value={item.tiene_avaluo ? 'Sí' : 'No'} />
            <DetailField label="Precio Avalúo" value={formatCurrency(item.precio_avaluo)} />
            <div />
            <DetailField label="Responsable" value={item.responsable_nombre} />
            <DetailField label="Teléfono" value={item.responsable_telefono} />
            <div className="col-span-2">
              <DetailField label="Email" value={item.responsable_email} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notas */}
      {item.notas && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.notas}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <div className="flex gap-4 text-xs text-slate-400 px-1">
        <span>Creado: {formatDate(item.created_at)}</span>
        {item.updated_at && <span>Actualizado: {formatDate(item.updated_at)}</span>}
      </div>

      <AddElectronicDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        locations={locations || []}
        onSuccess={refetch}
        editItem={item}
      />
    </div>
  )
}
