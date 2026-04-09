'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useInmuebleSearch, useInmuebleMutations, useInmuebleTypes } from '@/hooks/useInmuebles'
import { useLocations } from '@/hooks/useLocations'
import { useAuth } from '@/hooks/useAuth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2, Plus, Loader2, MapPin, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  DollarSign, FileText, Download, Search,
} from 'lucide-react'
import type { StockInmueble } from '@/types/database'

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

const PAGE_SIZE = 25

interface InmuebleFilters {
  inmueble_type_id?: number
  search?: string
  ciudad?: string
  municipio?: string
  nombre_institucion?: string
  avaluo?: string
  registro?: string
  planos_actualizados?: string
}

export default function InmueblesPage() {
  const router = useRouter()
  const { isAdmin, isOperador } = useAuth()
  const { locations } = useLocations()
  const { types: inmuebleTypes } = useInmuebleTypes()

  const instituciones = useMemo(() => {
    const set = new Set((locations || []).map((l) => l.nombre_institucion).filter(Boolean))
    return Array.from(set).sort()
  }, [locations])

  const municipios = useMemo(() => {
    const set = new Set((locations || []).map((l) => l.municipio).filter(Boolean))
    return Array.from(set).sort()
  }, [locations])

  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<InmuebleFilters>({})
  const [activeTab, setActiveTab] = useState('inventario')

  // Ley 7 filters
  const [ley7Filters, setLey7Filters] = useState<{ inmueble_type_id?: number; nombre_institucion?: string }>({})
  const [ley7Page, setLey7Page] = useState(1)

  const { items, totalCount, isLoading, refetch } = useInmuebleSearch({
    inmueble_type_id: filters.inmueble_type_id,
    search: filters.search,
    ciudad: filters.ciudad,
    municipio: filters.municipio,
    nombre_institucion: filters.nombre_institucion,
    avaluo: filters.avaluo,
    registro: filters.registro,
    planos_actualizados: filters.planos_actualizados,
    page,
    limit: PAGE_SIZE,
  })

  const { items: ley7Items, totalCount: ley7TotalCount, isLoading: ley7Loading } = useInmuebleSearch({
    inmueble_type_id: ley7Filters.inmueble_type_id,
    nombre_institucion: ley7Filters.nombre_institucion,
    page: ley7Page,
    limit: PAGE_SIZE,
  })

  const { remove } = useInmuebleMutations()
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const ley7TotalPages = Math.ceil(ley7TotalCount / PAGE_SIZE)

  const stats = useMemo(() => ({
    total: totalCount,
    valorTotal: items.reduce((sum, i) => sum + (i.valor || 0), 0),
  }), [items, totalCount])

  const handleFilterChange = (key: keyof InmuebleFilters, value: string | number | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const handleClearFilters = () => {
    setFilters({})
    setPage(1)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Eliminar este inmueble?')) return
    await remove.mutateAsync(id)
  }

  const handleEdit = (item: StockInmueble) => {
    router.push(`/inventory/stock/inmuebles/${item.id}`)
  }

  const handleLey7RowClick = (item: StockInmueble) => {
    router.push(`/inventory/stock/inmuebles/${item.id}`)
  }

  const handleExportLey7 = useCallback(async () => {
    try {
      const XLSX = await import('xlsx')
      const exportData = ley7Items.map((item) => ({
        'Tipo': item.inmueble_type?.nombre || '',
        'Institucion Responsable': item.location?.nombre_institucion || '',
        'Nombre': item.nombre,
        'Valor': item.valor ?? '',
        'Metros Cuadrados': item.metros_cuadrados ?? '',
      }))
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Ley 7 2023')
      XLSX.writeFile(wb, 'ley_7_2023_inmuebles.xlsx')
    } catch (err) {
      console.error('Error exporting:', err)
      alert('Error al exportar. Asegurate de tener la libreria xlsx instalada.')
    }
  }, [ley7Items])

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '--'
    return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(value)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Inmuebles"
        description="Gestion de inmuebles institucionales en stock activo"
        breadcrumbs={[
          { label: 'Inventario', href: '/inventory' },
          { label: 'Inventario General en Stock', href: '/inventory/stock' },
          { label: 'Inmuebles' },
        ]}
        actions={
          (isAdmin || isOperador) ? [
            activeTab === 'inventario' ? {
              label: 'Agregar Inmueble',
              icon: Plus,
              primary: true,
              href: '/inventory/stock/inmuebles/add',
            } : undefined,
          ].filter(Boolean) as any[] : undefined
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="inventario">Inventario de Inmuebles</TabsTrigger>
          <TabsTrigger value="ley7">Ley 7 2023</TabsTrigger>
          <TabsTrigger value="traspaso">Formulario de Traspaso</TabsTrigger>
        </TabsList>

        {/* ===== TAB: INVENTARIO ===== */}
        <TabsContent value="inventario">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Cantidad de Inmuebles</p>
                  <p className="font-semibold text-slate-900">{totalCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Valor Total (pag.)</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(stats.valorTotal)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm text-slate-700">Filtros</h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleClearFilters}>
                      Limpiar
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Tipo de Inmueble</Label>
                    <Select
                      value={filters.inmueble_type_id?.toString() || 'all'}
                      onValueChange={(v) => handleFilterChange('inmueble_type_id', v === 'all' ? undefined : parseInt(v))}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {inmuebleTypes.map((t) => (
                          <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Busqueda</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={filters.search || ''}
                        onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                        placeholder="Buscar por nombre..."
                        className="h-8 text-xs pl-7"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Ciudad</Label>
                    <Input
                      value={filters.ciudad || ''}
                      onChange={(e) => handleFilterChange('ciudad', e.target.value || undefined)}
                      placeholder="Ciudad..."
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Municipio</Label>
                    <Select
                      value={filters.municipio || 'all'}
                      onValueChange={(v) => handleFilterChange('municipio', v === 'all' ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {municipios.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Institución</Label>
                    <Select
                      value={filters.nombre_institucion || 'all'}
                      onValueChange={(v) => handleFilterChange('nombre_institucion', v === 'all' ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {instituciones.map((inst) => (
                          <SelectItem key={inst} value={inst}>{inst}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Avaluo</Label>
                    <Select
                      value={filters.avaluo || 'all'}
                      onValueChange={(v) => handleFilterChange('avaluo', v === 'all' ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Si">Si</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="En proceso">En proceso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Registro</Label>
                    <Select
                      value={filters.registro || 'all'}
                      onValueChange={(v) => handleFilterChange('registro', v === 'all' ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Si">Si</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="En proceso">En proceso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Planos Actualizados</Label>
                    <Select
                      value={filters.planos_actualizados || 'all'}
                      onValueChange={(v) => handleFilterChange('planos_actualizados', v === 'all' ? undefined : v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Si">Si</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                        <SelectItem value="En proceso">En proceso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Table */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                      <span className="ml-2 text-slate-500">Buscando inmuebles...</span>
                    </div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-16">
                      <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No se encontraron inmuebles</p>
                      <p className="text-sm text-slate-400 mt-1">Ajusta los filtros o agrega un inmueble</p>
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Nombre</th>
                              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo</th>
                              <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institucion</th>
                              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">m2</th>
                              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Avaluo</th>
                              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Registro</th>
                              <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Valor</th>
                              <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Estado</th>
                              {(isAdmin || isOperador) && (
                                <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Acciones</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item: StockInmueble) => (
                              <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => router.push(`/inventory/stock/inmuebles/${item.id}`)}>
                                <td className="px-4 py-3">
                                  <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{item.nombre}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-sm text-slate-600">{item.inmueble_type?.nombre || '--'}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                    <div>
                                      <p className="text-sm text-slate-700 font-medium truncate max-w-[160px]">
                                        {item.location?.nombre_institucion || '--'}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {[item.location?.ciudad, item.location?.municipio].filter(Boolean).join(', ')}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-sm text-slate-600">
                                    {item.metros_cuadrados != null ? item.metros_cuadrados.toLocaleString() : '--'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.avaluo ? (
                                    <Badge className={`text-xs ${AVALUO_COLORS[item.avaluo] || 'bg-slate-100 text-slate-700'}`}>
                                      {item.avaluo}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-slate-400">--</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {item.registro ? (
                                    <Badge className={`text-xs ${AVALUO_COLORS[item.registro] || 'bg-slate-100 text-slate-700'}`}>
                                      {item.registro}
                                    </Badge>
                                  ) : (
                                    <span className="text-sm text-slate-400">--</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className="text-sm text-slate-700">{formatCurrency(item.valor)}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge className={`text-xs ${ESTADO_COLORS[item.estado] || 'bg-slate-100 text-slate-700'}`}>
                                    {item.estado}
                                  </Badge>
                                </td>
                                {(isAdmin || isOperador) && (
                                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-1">
                                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleEdit(item)}>
                                        Editar
                                      </Button>
                                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(item.id)}>
                                        Eliminar
                                      </Button>
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
                          <p className="text-sm text-slate-500">
                            Mostrando {(page - 1) * PAGE_SIZE + 1}--{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
                          </p>
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

        {/* ===== TAB: LEY 7 2023 ===== */}
        <TabsContent value="ley7">
          {/* Ley 7 Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Tipo de Inmueble</Label>
                  <Select
                    value={ley7Filters.inmueble_type_id?.toString() || 'all'}
                    onValueChange={(v) => {
                      setLey7Filters((prev) => ({ ...prev, inmueble_type_id: v === 'all' ? undefined : parseInt(v) }))
                      setLey7Page(1)
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs w-[200px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {inmuebleTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Institucion</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input
                      value={ley7Filters.nombre_institucion || ''}
                      onChange={(e) => {
                        setLey7Filters((prev) => ({ ...prev, nombre_institucion: e.target.value || undefined }))
                        setLey7Page(1)
                      }}
                      placeholder="Buscar institucion..."
                      className="h-8 text-xs pl-7 w-[250px]"
                    />
                  </div>
                </div>

                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExportLey7}>
                  <Download className="h-3.5 w-3.5" />
                  Exportar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ley 7 Table */}
          <Card>
            <CardContent className="p-0">
              {ley7Loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-500">Cargando datos...</span>
                </div>
              ) : ley7Items.length === 0 ? (
                <div className="text-center py-16">
                  <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No se encontraron inmuebles</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institucion Responsable</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Nombre</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Valor</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">m2</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ley7Items.map((item: StockInmueble) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => handleLey7RowClick(item)}
                          >
                            <td className="px-4 py-3">
                              <span className="text-sm text-slate-600">{item.inmueble_type?.nombre || '--'}</span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-slate-700 font-medium truncate max-w-[200px]">
                                {item.location?.nombre_institucion || '--'}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm text-slate-700">{item.nombre}</p>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-slate-700">{formatCurrency(item.valor)}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm text-slate-600">
                                {item.metros_cuadrados != null ? item.metros_cuadrados.toLocaleString() : '--'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {ley7TotalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                      <p className="text-sm text-slate-500">
                        Mostrando {(ley7Page - 1) * PAGE_SIZE + 1}--{Math.min(ley7Page * PAGE_SIZE, ley7TotalCount)} de {ley7TotalCount}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={ley7Page === 1} onClick={() => setLey7Page(1)}><ChevronsLeft className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={ley7Page === 1} onClick={() => setLey7Page((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm text-slate-600 px-2">{ley7Page} / {ley7TotalPages}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={ley7Page === ley7TotalPages} onClick={() => setLey7Page((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={ley7Page === ley7TotalPages} onClick={() => setLey7Page(ley7TotalPages)}><ChevronsRight className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TAB: TRASPASO ===== */}
        <TabsContent value="traspaso">
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Formulario de Traspaso</p>
              <p className="text-sm text-slate-400 mt-1">Proximamente — En espera de definicion del formulario</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
