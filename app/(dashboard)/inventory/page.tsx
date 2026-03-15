'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWasteItemSearch } from '@/hooks/useWasteItemSearch'
import { useLocations } from '@/hooks/useLocations'
import { WasteItemFilterPanel } from '@/components/data/WasteItemFilterPanel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Package,
  Weight,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Search,
  MapPin,
} from 'lucide-react'
import type { WasteItemWithLocation } from '@/types/database'

const QUALITY_COLORS: Record<string, string> = {
  Excelente: 'bg-emerald-100 text-emerald-800',
  Buena: 'bg-blue-100 text-blue-800',
  Regular: 'bg-yellow-100 text-yellow-800',
  Baja: 'bg-orange-100 text-orange-800',
  Deficiente: 'bg-red-100 text-red-800',
}

const PAGE_SIZE = 25

export default function InventoryPage() {
  const router = useRouter()
  const { wasteTypes } = useLocations()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<{
    search: string
    waste_type_id?: number
    quality?: string
  }>({
    search: '',
  })

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const searchTimeout = useState<NodeJS.Timeout | null>(null)

  const handleFiltersChange = (newFilters: { search: string; waste_type_id?: number; quality?: string }) => {
    setFilters(newFilters)
    setPage(1)

    // Debounce the search text
    if (searchTimeout[0]) clearTimeout(searchTimeout[0])
    searchTimeout[1](
      setTimeout(() => {
        setDebouncedSearch(newFilters.search)
      }, 300)
    )
  }

  const { items, totalCount, isLoading } = useWasteItemSearch({
    search: debouncedSearch || undefined,
    waste_type_id: filters.waste_type_id,
    quality: filters.quality,
    page,
    limit: PAGE_SIZE,
  })

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Summary stats from current filtered results
  const summaryStats = useMemo(() => {
    return {
      totalItems: totalCount,
      totalVolume: items.reduce((sum, item) => sum + (item.volume || 0), 0),
      totalWeight: items.reduce((sum, item) => sum + (item.weight || 0), 0),
      totalValue: items.reduce((sum, item) => sum + (item.value || 0), 0),
    }
  }, [items, totalCount])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario de Residuos"
        description="Busca y filtra items de residuos a través de todas las ubicaciones"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Items</p>
              <p className="font-semibold text-slate-900">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Volumen (pág.)</p>
              <p className="font-semibold text-slate-900">{summaryStats.totalVolume.toFixed(2)} m³</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Weight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Peso (pág.)</p>
              <p className="font-semibold text-slate-900">{summaryStats.totalWeight.toFixed(2)} kg</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Valor (pág.)</p>
              <p className="font-semibold text-slate-900">${summaryStats.totalValue.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <WasteItemFilterPanel
            wasteTypes={wasteTypes || []}
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="ml-2 text-slate-500">Buscando items...</span>
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No se encontraron items</p>
                  <p className="text-sm text-slate-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Subcategoría</th>
                          <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Ubicación</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Volumen</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Peso</th>
                          <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Valor</th>
                          <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Calidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item: WasteItemWithLocation) => (
                          <tr
                            key={item.id}
                            className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => router.push(`/locations/${item.location_id}`)}
                          >
                            <td className="px-4 py-3">
                              <Badge className="bg-red-100 text-red-800 text-xs font-medium">
                                {item.waste_type?.nombre || 'Sin tipo'}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {item.subcategoria ? (
                                <span className="text-sm text-slate-700 font-medium">{item.subcategoria}</span>
                              ) : (
                                <span className="text-sm text-slate-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <div>
                                  <p className="text-sm text-slate-700 font-medium truncate max-w-[200px]">
                                    {item.location?.nombre_institucion || '—'}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {[item.location?.ciudad, item.location?.municipio].filter(Boolean).join(', ')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                              {item.volume} m³
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-slate-600">
                              {item.weight} kg
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                              ${item.value}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.quality ? (
                                <Badge className={`text-xs ${QUALITY_COLORS[item.quality] || 'bg-slate-100 text-slate-800'}`}>
                                  {item.quality}
                                </Badge>
                              ) : (
                                <span className="text-xs text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                      <p className="text-sm text-slate-500">
                        Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, totalCount)} de {totalCount}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={page === 1}
                          onClick={() => setPage(1)}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={page === 1}
                          onClick={() => setPage(p => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-slate-600 px-2">
                          {page} / {totalPages}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={page === totalPages}
                          onClick={() => setPage(p => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={page === totalPages}
                          onClick={() => setPage(totalPages)}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
