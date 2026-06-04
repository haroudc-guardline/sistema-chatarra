'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { inmuebleService } from '@/lib/services/inmueble-service'
import { useAuth } from '@/hooks/useAuth'
import { useInmuebleMutations } from '@/hooks/useInmuebles'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2, Pencil, Trash2, MapPin, Building2, ArrowLeft,
} from 'lucide-react'
import { AvaluosTab } from '@/components/inmuebles/AvaluosTab'
import { DocumentosTab } from '@/components/inmuebles/DocumentosTab'
import { GaleriaTab } from '@/components/inmuebles/GaleriaTab'
import { IncidenciasTab } from '@/components/inmuebles/IncidenciasTab'

const ESTADO_COLORS: Record<string, string> = {
  'Activo': 'bg-emerald-100 text-emerald-800',
  'En reparacion': 'bg-yellow-100 text-yellow-800',
  'Fuera de servicio': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

const AVALUO_COLORS: Record<string, string> = {
  'Si': 'bg-emerald-100 text-emerald-800',
  'No': 'bg-red-100 text-red-800',
  'En proceso': 'bg-yellow-100 text-yellow-800',
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value ?? '—'}</p>
    </div>
  )
}

export default function InmuebleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { isAdmin, isOperador } = useAuth()
  const { remove } = useInmuebleMutations()
  const canEdit = isAdmin || isOperador

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['stockInmueble', id],
    queryFn: () => inmuebleService.getInmueble(Number(id)),
  })

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatCurrency = (value?: number | null) => {
    if (value === undefined || value === null) return '—'
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value)
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este inmueble?')) return
    await remove.mutateAsync(Number(id))
    router.push('/inventory/stock/inmuebles')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Cargando inmueble...</span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="text-center py-24">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Inmueble no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/inventory/stock/inmuebles')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
        </Button>
      </div>
    )
  }

  // "Valor que suma": avalúo vigente manda; si no, desglose; si no, valor capturado.
  const valorQueSuma =
    item.avaluo_vigente_monto != null
      ? item.avaluo_vigente_monto
      : (item.valor_terreno != null || item.valor_mejoras != null)
        ? (item.valor_terreno ?? 0) + (item.valor_mejoras ?? 0)
        : item.valor

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.nombre}
        description={item.inmueble_type?.nombre || undefined}
        breadcrumbs={[
          { label: 'Inventario', href: '/inventory' },
          { label: 'Inventario General en Stock', href: '/inventory/stock' },
          { label: 'Inmuebles', href: '/inventory/stock/inmuebles' },
          { label: item.nombre },
        ]}
        actions={
          canEdit ? [
            {
              label: 'Editar',
              icon: Pencil,
              href: `/inventory/stock/inmuebles/${id}/edit`,
              variant: 'outline' as const,
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

      <Tabs defaultValue="resumen">
        <TabsList className="mb-4">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="avaluos">Avalúos</TabsTrigger>
          <TabsTrigger value="galeria">Galería</TabsTrigger>
          <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
        </TabsList>

        {/* ===== RESUMEN ===== */}
        <TabsContent value="resumen">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información General */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Información del Inmueble</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <DetailField label="Nombre" value={item.nombre} />
                <DetailField label="Tipo de Inmueble" value={item.inmueble_type?.nombre} />
                <DetailField label="Tipo de Activo" value={item.activo_type?.nombre} />
                <DetailField label="Metros Cuadrados" value={item.metros_cuadrados?.toLocaleString()} />
                <DetailField label="Planos Actualizados" value={item.planos_actualizados} />
              </CardContent>
            </Card>

            {/* Titular e Institución */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Titular, Institución y Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <DetailField label="A nombre de (titular)" value={item.titular_nombre} />
                <DetailField label="Tipo de titular" value={item.titular_tipo} />
                <DetailField label="Ministerio" value={item.ministerio} />
                <DetailField label="Institución" value={item.location?.nombre_institucion} />
                <DetailField label="Ciudad" value={item.location?.ciudad || item.ubicacion_ciudad} />
                <DetailField label="Municipio" value={item.location?.municipio || item.ubicacion_municipio} />
                <div className="col-span-2">
                  <DetailField label="Dirección" value={item.ubicacion_direccion} />
                </div>
              </CardContent>
            </Card>

            {/* Valor y Avalúo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Valoración</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <DetailField label="Valor de la tierra" value={formatCurrency(item.valor_terreno)} />
                <DetailField label="Valor catastral (escritura)" value={formatCurrency(item.valor_catastral)} />
                <DetailField label="Valor de mejoras (edificio)" value={formatCurrency(item.valor_mejoras)} />
                <DetailField label="Avalúo vigente" value={formatCurrency(item.avaluo_vigente_monto)} />
                <div className="col-span-2 pt-2 border-t">
                  <p className="text-xs text-slate-500 mb-0.5">Valor que suma en totales</p>
                  <p className="text-lg font-semibold text-emerald-700">{formatCurrency(valorQueSuma)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Estado Legal + Responsable */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estado Legal y Responsable</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Avalúo</p>
                  {item.avaluo ? (
                    <Badge className={`text-xs ${AVALUO_COLORS[item.avaluo] || 'bg-slate-100 text-slate-700'}`}>{item.avaluo}</Badge>
                  ) : <p className="text-sm font-medium text-slate-900">—</p>}
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Registro</p>
                  {item.registro ? (
                    <Badge className={`text-xs ${AVALUO_COLORS[item.registro] || 'bg-slate-100 text-slate-700'}`}>{item.registro}</Badge>
                  ) : <p className="text-sm font-medium text-slate-900">—</p>}
                </div>
                <DetailField label="Responsable" value={item.responsable_nombre} />
                <DetailField label="Teléfono" value={item.responsable_telefono} />
                <div className="col-span-2">
                  <DetailField label="Email" value={item.responsable_email} />
                </div>
              </CardContent>
            </Card>
          </div>

          {item.notas && (
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.notas}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 text-xs text-slate-400 px-1 mt-4">
            <span>Creado: {formatDate(item.created_at)}</span>
            {item.updated_at && <span>Actualizado: {formatDate(item.updated_at)}</span>}
          </div>
        </TabsContent>

        <TabsContent value="documentos">
          <DocumentosTab inmuebleId={Number(id)} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="avaluos">
          <AvaluosTab inmuebleId={Number(id)} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="galeria">
          <GaleriaTab inmuebleId={Number(id)} canEdit={canEdit} />
        </TabsContent>
        <TabsContent value="incidencias">
          <IncidenciasTab inmuebleId={Number(id)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
