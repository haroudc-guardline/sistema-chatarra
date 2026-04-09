'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useFurnitureSearch, useFurnitureMutations } from '@/hooks/useStockItems'
import { useLocations } from '@/hooks/useLocations'
import { useAuth } from '@/hooks/useAuth'
import { StockFilterPanel, type StockFilters } from '@/components/data/StockFilterPanel'
import { AddFurnitureDialog } from '@/components/forms/AddFurnitureDialog'
import { BancoPiezasTable } from '@/components/stock/BancoPiezasTable'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Armchair, Plus, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, FileText,
} from 'lucide-react'
import type { StockFurniture } from '@/types/database'

const ESTADO_COLORS: Record<string, string> = {
  'Operativo': 'bg-emerald-100 text-emerald-800',
  'En reparacion': 'bg-yellow-100 text-yellow-800',
  'Fuera de servicio': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

const PAGE_SIZE = 25

export default function MueblesPage() {
  const router = useRouter()
  const { isAdmin, isOperador } = useAuth()
  const { locations } = useLocations()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<StockFilters>({})
  const [activeTab, setActiveTab] = useState('stock')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<StockFurniture | undefined>()

  const { items, totalCount, isLoading, refetch } = useFurnitureSearch({
    estado: filters.estado,
    tipo_mueble: filters.tipo_mueble,
    search: filters.search,
    municipio: filters.municipio,
    nombre_institucion: filters.nombre_institucion,
    page,
    limit: PAGE_SIZE,
  })

  const { remove } = useFurnitureMutations()
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const municipios = useMemo(() => {
    const set = new Set((locations || []).map((l) => l.municipio).filter(Boolean))
    return Array.from(set).sort()
  }, [locations])

  const instituciones = useMemo(() => {
    const set = new Set((locations || []).map((l) => l.nombre_institucion).filter(Boolean))
    return Array.from(set).sort()
  }, [locations])

  const stats = useMemo(() => ({
    total: totalCount,
    operativos: items.filter((i) => i.estado === 'Operativo').length,
    enReparacion: items.filter((i) => i.estado === 'En reparacion').length,
  }), [items, totalCount])

  const handleFiltersChange = (f: StockFilters) => { setFilters(f); setPage(1) }
  const handleEdit = (item: StockFurniture) => { setEditItem(item); setDialogOpen(true) }
  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este mueble?')) return
    await remove.mutateAsync(id)
  }

  const formatDate = (d?: string) => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Muebles"
        description="Gestion de muebles institucionales en stock activo"
        breadcrumbs={[
          { label: 'Inventario', href: '/inventory' },
          { label: 'Inventario General en Stock', href: '/inventory/stock' },
          { label: 'Muebles' },
        ]}
        actions={
          (isAdmin || isOperador) && activeTab === 'stock' ? [
            {
              label: 'Agregar Mueble',
              icon: Plus,
              primary: true,
              onClick: () => { setEditItem(undefined); setDialogOpen(true) },
            },
          ] : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="stock">Muebles en Stock</TabsTrigger>
          <TabsTrigger value="piezas">Banco de Piezas</TabsTrigger>
          <TabsTrigger value="traspaso">Formulario de Traspaso</TabsTrigger>
        </TabsList>

        <TabsContent value="stock">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Armchair className="h-5 w-5 text-orange-600" />
            </div>
            <div><p className="text-xs text-slate-500">Total Muebles</p><p className="font-semibold text-slate-900">{totalCount}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Armchair className="h-5 w-5 text-emerald-600" />
            </div>
            <div><p className="text-xs text-slate-500">Operativos (pag.)</p><p className="font-semibold text-slate-900">{stats.operativos}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Armchair className="h-5 w-5 text-yellow-600" />
            </div>
            <div><p className="text-xs text-slate-500">En Reparacion (pag.)</p><p className="font-semibold text-slate-900">{stats.enReparacion}</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div><p className="text-xs text-slate-500">Con mantenimiento</p><p className="font-semibold text-slate-900">{items.filter((i) => i.frecuencia_mantenimiento).length}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <StockFilterPanel category="muebles" filters={filters} municipios={municipios} instituciones={instituciones} onFiltersChange={handleFiltersChange} />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-500">Buscando muebles...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <Armchair className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No se encontraron muebles</p>
                  <p className="text-sm text-slate-400 mt-1">Ajusta los filtros o agrega un mueble</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institucion</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Nombre</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Marca / Modelo</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Material</th>
                          <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Estado</th>
                          {(isAdmin || isOperador) && (
                            <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Acciones</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: StockFurniture) => (
                          <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/inventory/stock/muebles/${item.id}`)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-700 font-medium truncate max-w-[140px]">{item.location?.nombre_institucion || '—'}</p>
                                  <p className="text-xs text-slate-400">{[item.location?.ciudad, item.location?.municipio].filter(Boolean).join(', ')}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-700">{item.nombre}</p>
                              <p className="text-xs text-slate-400">{item.numero_serie || '—'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600">{[item.marca, item.modelo].filter(Boolean).join(' ') || '—'}</span>
                            </td>
                            <td className="px-4 py-3"><span className="text-sm text-slate-600">{item.tipo_mueble || '—'}</span></td>
                            <td className="px-4 py-3"><span className="text-sm text-slate-600">{item.material || '—'}</span></td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={`text-xs ${ESTADO_COLORS[item.estado] || 'bg-slate-100 text-slate-700'}`}>{item.estado}</Badge>
                            </td>
                            {(isAdmin || isOperador) && (
                              <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
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
          <BancoPiezasTable category="furniture" locations={locations || []} />
        </TabsContent>

        <TabsContent value="traspaso">
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Formulario de Traspaso de Piezas</p>
              <p className="text-sm text-slate-400 mt-1">Proximamente — En espera de definicion del formulario</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddFurnitureDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(undefined) }}
        locations={locations || []}
        onSuccess={refetch}
        editItem={editItem}
      />
    </div>
  )
}
