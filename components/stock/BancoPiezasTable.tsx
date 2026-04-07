'use client'

import { useState, useMemo } from 'react'
import { usePartSearch, usePartTypes, usePartMutations } from '@/hooks/useParts'
import { useAuth } from '@/hooks/useAuth'
import { AddPartDialog } from '@/components/forms/AddPartDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Cog, Plus, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Package, CheckCircle2, AlertTriangle, XCircle, Search,
} from 'lucide-react'
import type { PartCategory, Location, StockPart } from '@/types/database'
import type { PartSearchFilters } from '@/lib/services/parts-service'

const ESTADO_COLORS: Record<string, string> = {
  'Disponible': 'bg-emerald-100 text-emerald-800',
  'En uso': 'bg-blue-100 text-blue-800',
  'Dañada': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

const ESTADO_OPTIONS = ['Disponible', 'En uso', 'Dañada', 'Dado de baja'] as const

const PAGE_SIZE = 25

interface BancoPiezasTableProps {
  category: PartCategory
  locations: Location[]
}

export function BancoPiezasTable({ category, locations }: BancoPiezasTableProps) {
  const { isAdmin, isOperador } = useAuth()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<PartSearchFilters>({})
  const [searchInput, setSearchInput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<StockPart | undefined>()

  const { partTypes } = usePartTypes(category)
  const { items, totalCount, isLoading, refetch } = usePartSearch(category, {
    ...filters,
    page,
    limit: PAGE_SIZE,
  })
  const { remove } = usePartMutations(category)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

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

      {/* Inline filters + Add button */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por marca, modelo..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-9"
          />
        </div>
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
        {(isAdmin || isOperador) && (
          <Button onClick={() => { setEditItem(undefined); setDialogOpen(true) }} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Agregar Pieza
          </Button>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
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

      <AddPartDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(undefined) }}
        category={category}
        locations={locations}
        onSuccess={refetch}
        editItem={editItem}
      />
    </div>
  )
}
