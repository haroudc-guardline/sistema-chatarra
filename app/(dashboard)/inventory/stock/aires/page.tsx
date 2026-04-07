'use client'

import { useState, useMemo } from 'react'
import { useAcUnitSearch, useAcUnitMutations } from '@/hooks/useStockItems'
import { useLocations } from '@/hooks/useLocations'
import { useAuth } from '@/hooks/useAuth'
import { StockFilterPanel, type StockFilters } from '@/components/data/StockFilterPanel'
import { AddAcUnitDialog } from '@/components/forms/AddAcUnitDialog'
import { BancoPiezasTable } from '@/components/stock/BancoPiezasTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Wind, Plus, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Wrench, Calendar, FileText,
} from 'lucide-react'
import type { StockAcUnit } from '@/types/database'

const ESTADO_COLORS: Record<string, string> = {
  'Operativo': 'bg-emerald-100 text-emerald-800',
  'En reparación': 'bg-yellow-100 text-yellow-800',
  'Fuera de servicio': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

const PAGE_SIZE = 25

export default function AiresPage() {
  const { isAdmin, isOperador } = useAuth()
  const { locations } = useLocations()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<StockFilters>({})
  const [activeTab, setActiveTab] = useState('stock')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<StockAcUnit | undefined>()

  const { items, totalCount, isLoading, refetch } = useAcUnitSearch({
    estado: filters.estado,
    tipo_ac: filters.tipo_ac,
    search: filters.search,
    municipio: filters.municipio,
    page,
    limit: PAGE_SIZE,
  })

  const { remove } = useAcUnitMutations()
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const municipios = useMemo(() => {
    const set = new Set((locations || []).map((l) => l.municipio).filter(Boolean))
    return Array.from(set).sort()
  }, [locations])

  const stats = useMemo(() => ({
    total: totalCount,
    operativos: items.filter((i) => i.estado === 'Operativo').length,
    enReparacion: items.filter((i) => i.estado === 'En reparación').length,
    proximoMant: items.filter((i) => {
      if (!i.fecha_ultimo_mantenimiento || !i.frecuencia_mantenimiento) return false
      const d = new Date(i.fecha_ultimo_mantenimiento)
      const months: Record<string, number> = { Mensual: 1, Trimestral: 3, Semestral: 6, Anual: 12 }
      d.setMonth(d.getMonth() + (months[i.frecuencia_mantenimiento] || 12))
      const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      return diff >= 0 && diff <= 30
    }).length,
  }), [items, totalCount])

  const handleFiltersChange = (f: StockFilters) => { setFilters(f); setPage(1) }
  const handleEdit = (item: StockAcUnit) => { setEditItem(item); setDialogOpen(true) }
  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await remove.mutateAsync(id)
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Aires Acondicionados"
        description="Gestión de equipos de climatización en stock activo"
        breadcrumbs={[
          { label: 'Inventario', href: '/inventory' },
          { label: 'Inventario General en Stock', href: '/inventory/stock' },
          { label: 'Aires Acondicionados' },
        ]}
        actions={
          (isAdmin || isOperador) && activeTab === 'stock' ? [
            {
              label: 'Agregar A/C',
              icon: Plus,
              primary: true,
              onClick: () => { setEditItem(undefined); setDialogOpen(true) },
            },
          ] : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="stock">A/C en Stock</TabsTrigger>
          <TabsTrigger value="piezas">Banco de Piezas</TabsTrigger>
          <TabsTrigger value="traspaso">Formulario de Traspaso</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
              <Wind className="h-5 w-5 text-teal-600" />
            </div>
            <div><p className="text-xs text-slate-500">Total Equipos</p><p className="font-semibold text-slate-900">{totalCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Wind className="h-5 w-5 text-emerald-600" />
            </div>
            <div><p className="text-xs text-slate-500">Operativos (pág.)</p><p className="font-semibold text-slate-900">{stats.operativos}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-yellow-600" />
            </div>
            <div><p className="text-xs text-slate-500">En Reparación (pág.)</p><p className="font-semibold text-slate-900">{stats.enReparacion}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div><p className="text-xs text-slate-500">Próximo Mant.</p><p className="font-semibold text-slate-900">{stats.proximoMant}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <StockFilterPanel category="aires" filters={filters} municipios={municipios} onFiltersChange={handleFiltersChange} />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-500">Buscando equipos...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <Wind className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No se encontraron equipos</p>
                  <p className="text-sm text-slate-400 mt-1">Ajusta los filtros o agrega un equipo</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institución</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Marca / Modelo</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Serie</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">BTU</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Últ. Mant.</th>
                          <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Estado</th>
                          {(isAdmin || isOperador) && (
                            <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Acciones</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: StockAcUnit) => (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-700 font-medium truncate max-w-[160px]">{item.location?.nombre_institucion || '—'}</p>
                                  <p className="text-xs text-slate-400">{[item.location?.ciudad, item.location?.municipio].filter(Boolean).join(', ')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700">{item.marca} {item.modelo}</p>
                              <p className="text-xs text-slate-400">{item.ubicacion_nombre || '—'}</p>
                            </td>
                            <td className="px-4 py-3"><span className="text-sm text-slate-600">{item.numero_serie || '—'}</span></td>
                            <td className="px-4 py-3"><span className="text-sm text-slate-600">{item.tipo_ac || '—'}</span></td>
                            <td className="px-4 py-3 text-right"><span className="text-sm text-slate-600">{item.capacidad_btu?.toLocaleString() || '—'}</span></td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600">
                                {formatDate(item.fecha_ultimo_mantenimiento)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={`text-xs ${ESTADO_COLORS[item.estado] || 'bg-slate-100 text-slate-700'}`}>{item.estado}</Badge>
                            </td>
                            {(isAdmin || isOperador) && (
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleEdit(item)}>Editar</Button>
                                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>Eliminar</Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                      <p className="text-sm text-slate-500">Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}</p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(1)}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

        </TabsContent>

        <TabsContent value="piezas">
          <BancoPiezasTable category="ac_unit" locations={locations || []} />
        </TabsContent>

        <TabsContent value="traspaso">
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Formulario de Traspaso de Piezas</p>
              <p className="text-sm text-slate-400 mt-1">Próximamente — En espera de definición del formulario</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddAcUnitDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(undefined) }}
        locations={locations || []}
        onSuccess={refetch}
        editItem={editItem}
      />
    </div>
  )
}
