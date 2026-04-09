'use client'

import { useState, useMemo } from 'react'
import { usePartSearch, usePartTypes, usePartMutations } from '@/hooks/useParts'
import { useMarbeteSearch, useMarbeteMutations, useMarbeteDetail } from '@/hooks/useMarbetes'
import { useAuth } from '@/hooks/useAuth'
import { AddPartDialog } from '@/components/forms/AddPartDialog'
import { AddMarbeteDialog } from '@/components/forms/AddMarbeteDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Cog, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Package, CheckCircle2, AlertTriangle, XCircle, Search, Tag,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import type { PartCategory, Location, StockPart, Marbete } from '@/types/database'
import type { PartSearchFilters } from '@/lib/services/parts-service'

const ESTADO_COLORS: Record<string, string> = {
  'Disponible': 'bg-emerald-100 text-emerald-800',
  'En uso': 'bg-blue-100 text-blue-800',
  'Dañada': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

const ESTADO_OPTIONS = ['Disponible', 'En uso', 'Dañada', 'Dado de baja'] as const

const PAGE_SIZE = 25

type ViewMode = 'marbetes' | 'piezas'

interface BancoPiezasTableProps {
  category: PartCategory
  locations: Location[]
}

// Sub-component: Expandable marbete row with its parts
function MarbeteRow({
  marbete,
  category,
  isAdmin,
  isOperador,
  onAddParts,
  onDeleteMarbete,
}: {
  marbete: Marbete
  category: PartCategory
  isAdmin: boolean
  isOperador: boolean
  onAddParts: (m: Marbete) => void
  onDeleteMarbete: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { marbete: detail, isLoading } = useMarbeteDetail(expanded ? marbete.id : null)
  const parts = detail?.parts ?? []

  return (
    <>
      <tr
        className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
            <Tag className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-slate-800">{marbete.codigo}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-slate-700 font-medium truncate max-w-[180px]">
            {marbete.location?.nombre_institucion || '—'}
          </p>
          <p className="text-xs text-slate-400">
            {[marbete.location?.ciudad, marbete.location?.municipio].filter(Boolean).join(', ')}
          </p>
        </td>
        <td className="px-4 py-3 text-center">
          <Badge variant="secondary" className="text-xs">
            {marbete.parts_count ?? 0} pieza{(marbete.parts_count ?? 0) !== 1 ? 's' : ''}
          </Badge>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-slate-700">{marbete.responsable_nombre || '—'}</p>
          {marbete.responsable_telefono && (
            <p className="text-xs text-slate-400">{marbete.responsable_telefono}</p>
          )}
        </td>
        <td className="px-4 py-3">
          <p className="text-sm text-slate-500 truncate max-w-[180px]">
            {[marbete.ubicacion_nombre, marbete.ubicacion_municipio].filter(Boolean).join(', ') || '—'}
          </p>
        </td>
        {(isAdmin || isOperador) && (
          <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onAddParts(marbete)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Piezas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDeleteMarbete(marbete.id)}
              >
                Eliminar
              </Button>
            </div>
          </td>
        )}
      </tr>

      {/* Expanded: show parts */}
      {expanded && (
        <tr>
          <td colSpan={6} className="bg-slate-50/50 px-0 py-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                <span className="ml-2 text-sm text-slate-500">Cargando piezas...</span>
              </div>
            ) : parts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400">Sin piezas registradas</p>
                {(isAdmin || isOperador) && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-600 mt-1"
                    onClick={() => onAddParts(marbete)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar primera pieza
                  </Button>
                )}
              </div>
            ) : (
              <div className="px-6 py-3">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">Tipo de Pieza</th>
                      <th className="text-left text-xs font-medium text-slate-500 px-3 py-2">Marca / Modelo</th>
                      <th className="text-center text-xs font-medium text-slate-500 px-3 py-2">Cantidad</th>
                      <th className="text-center text-xs font-medium text-slate-500 px-3 py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parts.map((part: StockPart) => (
                      <tr key={part.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2">
                          <span className="text-sm text-slate-700">{part.part_type?.nombre || '—'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-sm text-slate-600">
                            {[part.marca, part.modelo].filter(Boolean).join(' ') || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="text-sm font-semibold text-slate-700">{part.cantidad}</span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Badge className={`text-xs ${ESTADO_COLORS[part.estado] || 'bg-slate-100 text-slate-700'}`}>
                            {part.estado}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export function BancoPiezasTable({ category, locations }: BancoPiezasTableProps) {
  const { isAdmin, isOperador } = useAuth()
  const [viewMode, setViewMode] = useState<ViewMode>('marbetes')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<PartSearchFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<StockPart | undefined>()
  const [marbeteDialogOpen, setMarbeteDialogOpen] = useState(false)
  const [addPartsToMarbete, setAddPartsToMarbete] = useState<Marbete | undefined>()

  const { partTypes } = usePartTypes(category)

  // Parts data (flat view)
  const { items, totalCount, isLoading: partsLoading, refetch: refetchParts } = usePartSearch(category, {
    ...filters,
    page,
    limit: PAGE_SIZE,
  })
  const { remove } = usePartMutations(category)

  // Marbetes data (grouped view)
  const { marbetes, totalCount: marbetesCount, isLoading: marbetesLoading, refetch: refetchMarbetes } = useMarbeteSearch(category, {
    search: viewMode === 'marbetes' ? (filters.search || undefined) : undefined,
    page: viewMode === 'marbetes' ? page : 1,
    limit: PAGE_SIZE,
  })
  const { remove: removeMarbete } = useMarbeteMutations(category)

  const totalPages = Math.ceil(
    (viewMode === 'marbetes' ? marbetesCount : totalCount) / PAGE_SIZE
  )
  const isLoading = viewMode === 'marbetes' ? marbetesLoading : partsLoading

  // Stats computed from current page data
  const stats = useMemo(() => ({
    total: totalCount,
    disponibles: items.filter((i) => i.estado === 'Disponible').length,
    enUso: items.filter((i) => i.estado === 'En uso').length,
    danadas: items.filter((i) => i.estado === 'Dañada').length,
  }), [items, totalCount])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }))
      setPage(1)
    }
  }

  const handleEstadoChange = (value: string) => {
    setFilters((prev) => ({ ...prev, estado: value === 'all' ? undefined : value }))
    setPage(1)
  }

  const handlePartTypeChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      part_type_id: value === 'all' ? undefined : parseInt(value),
    }))
    setPage(1)
  }

  const handleEdit = (item: StockPart) => {
    setEditItem(item)
    setDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta pieza?')) return
    await remove.mutateAsync(id)
  }

  const handleDeleteMarbete = async (id: number) => {
    if (!confirm('¿Eliminar este marbete y desasociar sus piezas?')) return
    await removeMarbete.mutateAsync(id)
    refetchMarbetes()
  }

  const handleRefreshAll = () => {
    refetchParts()
    refetchMarbetes()
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Piezas</p>
              <p className="font-semibold text-slate-900">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Disponibles (pág.)</p>
              <p className="font-semibold text-slate-900">{stats.disponibles}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Cog className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">En Uso (pág.)</p>
              <p className="font-semibold text-slate-900">{stats.enUso}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Dañadas (pág.)</p>
              <p className="font-semibold text-slate-900">{stats.danadas}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View mode toggle + Filters + Add button */}
      <div className="space-y-3">
        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'marbetes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => { setViewMode('marbetes'); setPage(1) }}
            >
              <Tag className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
              Por Marbete
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'piezas'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => { setViewMode('piezas'); setPage(1) }}
            >
              <Package className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
              Todas las Piezas
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={viewMode === 'marbetes' ? 'Buscar por código de marbete...' : 'Buscar por marca, modelo...'}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="pl-9"
            />
          </div>

          {viewMode === 'piezas' && (
            <>
              <Select
                value={filters.part_type_id?.toString() || 'all'}
                onValueChange={handlePartTypeChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de pieza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {partTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id.toString()}>{pt.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.estado || 'all'}
                onValueChange={handleEstadoChange}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ESTADO_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {(isAdmin || isOperador) && (
            <div className="flex items-center gap-2 ml-auto">
              {viewMode === 'piezas' && (
                <Button
                  variant="outline"
                  onClick={() => { setEditItem(undefined); setDialogOpen(true) }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Pieza Suelta
                </Button>
              )}
              <Button
                onClick={() => { setAddPartsToMarbete(undefined); setMarbeteDialogOpen(true) }}
              >
                <Tag className="h-4 w-4 mr-2" />
                {viewMode === 'marbetes' ? 'Nuevo Marbete + Piezas' : 'Agregar por Marbete'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ─── MARBETES VIEW ─── */}
      {viewMode === 'marbetes' && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-500">Buscando marbetes...</span>
              </div>
            ) : marbetes.length === 0 ? (
              <div className="text-center py-16">
                <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No se encontraron marbetes</p>
                <p className="text-sm text-slate-400 mt-1">Crea un marbete para agrupar piezas</p>
                {(isAdmin || isOperador) && (
                  <Button
                    className="mt-4"
                    onClick={() => { setAddPartsToMarbete(undefined); setMarbeteDialogOpen(true) }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Crear Primer Marbete
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Código Marbete</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institución</th>
                        <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Piezas</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Responsable</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Ubicación</th>
                        {(isAdmin || isOperador) && (
                          <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {marbetes.map((m) => (
                        <MarbeteRow
                          key={m.id}
                          marbete={m}
                          category={category}
                          isAdmin={isAdmin}
                          isOperador={isOperador}
                          onAddParts={(marbete) => {
                            setAddPartsToMarbete(marbete)
                            setMarbeteDialogOpen(true)
                          }}
                          onDeleteMarbete={handleDeleteMarbete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, marbetesCount)} de {marbetesCount}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(1)}>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── FLAT PIEZAS VIEW (original) ─── */}
      {viewMode === 'piezas' && (
        <Card>
          <CardContent className="p-0">
            {partsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-500">Buscando piezas...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-16">
                <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No se encontraron piezas</p>
                <p className="text-sm text-slate-400 mt-1">Ajusta los filtros o agrega una pieza</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo de Pieza</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Marca / Modelo</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institución</th>
                        <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Cantidad</th>
                        <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Estado</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Marbete</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Responsable</th>
                        {(isAdmin || isOperador) && (
                          <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Acciones</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item: StockPart) => (
                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-slate-700">
                              {item.part_type?.nombre || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">
                              {[item.marca, item.modelo].filter(Boolean).join(' ') || '—'}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700 font-medium truncate max-w-[180px]">
                              {item.location?.nombre_institucion || '—'}
                            </p>
                            <p className="text-xs text-slate-400">
                              {[item.location?.ciudad, item.location?.municipio].filter(Boolean).join(', ')}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-sm font-semibold text-slate-700">{item.cantidad}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge className={`text-xs ${ESTADO_COLORS[item.estado] || 'bg-slate-100 text-slate-700'}`}>
                              {item.estado}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {item.codigo_marbete ? (
                              <Badge variant="outline" className="text-xs font-mono">
                                <Tag className="h-3 w-3 mr-1" />
                                {item.codigo_marbete}
                              </Badge>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-700">{item.responsable_nombre || '—'}</p>
                            {item.responsable_telefono && (
                              <p className="text-xs text-slate-400">{item.responsable_telefono}</p>
                            )}
                          </td>
                          {(isAdmin || isOperador) && (
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleEdit(item)}>
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDelete(item.id)}
                                >
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
                      Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(1)}>
                        <ChevronsLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-slate-600 px-2">{page} / {totalPages}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(totalPages)}>
                        <ChevronsRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddPartDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(undefined) }}
        category={category}
        locations={locations}
        onSuccess={handleRefreshAll}
        editItem={editItem}
      />

      <AddMarbeteDialog
        open={marbeteDialogOpen}
        onOpenChange={(open) => {
          setMarbeteDialogOpen(open)
          if (!open) setAddPartsToMarbete(undefined)
        }}
        category={category}
        locations={locations}
        onSuccess={handleRefreshAll}
        existingMarbete={addPartsToMarbete}
      />
    </div>
  )
}
