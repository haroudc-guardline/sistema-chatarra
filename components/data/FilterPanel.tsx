'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useLocations } from '@/hooks/useLocations'
import { locationService } from '@/lib/services/location-service'
import { Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ZONES, getCitiesForZone } from '@/lib/constants/zones'

interface FilterPanelProps {
  filters: {
    zona?: number
    ciudad?: string
    municipio?: string
    search?: string
    wasteTypeIds?: number[]
  }
  onFiltersChange: (filters: {
    zona?: number
    ciudad?: string
    municipio?: string
    search?: string
    wasteTypeIds?: number[]
  }) => void
  className?: string
}

export function FilterPanel({ filters, onFiltersChange, className }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState(filters)
  const { cities, wasteTypes } = useLocations()
  const [municipios, setMunicipios] = useState<string[]>([])

  // Keep localFilters in sync when parent resets or changes filters externally
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Load municipalities when city changes
  useEffect(() => {
    const loadMunicipios = async () => {
      if (localFilters.ciudad) {
        const data = await locationService.getMunicipios(localFilters.ciudad)
        setMunicipios(data)
      } else {
        setMunicipios([])
      }
    }
    loadMunicipios()
  }, [localFilters.ciudad])

  // Filter cities by zone if a zone is selected
  const availableCities = localFilters.zona
    ? cities?.filter(c => getCitiesForZone(localFilters.zona!).includes(c))
    : cities

  // Count only non-empty active filters (empty arrays don't count)
  const activeFiltersCount = [
    filters.zona,
    filters.ciudad,
    filters.municipio,
    filters.search,
    filters.wasteTypeIds?.length ? filters.wasteTypeIds : undefined,
  ].filter(Boolean).length

  const handleApply = () => {
    onFiltersChange(localFilters)
    setIsExpanded(false)
  }

  const handleReset = () => {
    const reset = {}
    setLocalFilters(reset)
    onFiltersChange(reset)
  }

  const toggleWasteType = (id: number) => {
    setLocalFilters((prev) => {
      const current = prev.wasteTypeIds ?? []
      const updated = current.includes(id)
        ? current.filter((tid) => tid !== id)
        : [...current, id]
      // Use undefined instead of [] so the filter is properly cleared
      return { ...prev, wasteTypeIds: updated.length > 0 ? updated : undefined }
    })
  }

  return (
    <div className={cn('bg-white border rounded-lg', className)}>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 lg:hidden"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <span className="font-medium text-slate-700">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {/* Filter Content */}
      <div
        className={cn(
          'p-4 space-y-4',
          !isExpanded && 'hidden lg:block'
        )}
      >
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="search"
              placeholder="Nombre de institución..."
              value={localFilters.search || ''}
              onChange={(e) =>
                setLocalFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-9"
            />
          </div>
        </div>

        {/* Zone */}
        <div className="space-y-2">
          <Label>Zona</Label>
          <Select
            value={localFilters.zona?.toString() ?? 'all'}
            onValueChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                zona: value === 'all' ? undefined : parseInt(value),
                ciudad: undefined,
                municipio: undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las zonas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las zonas</SelectItem>
              {ZONES.map((zone) => (
                <SelectItem key={zone.id} value={zone.id.toString()}>
                  <div className="flex flex-col">
                    <span>{zone.label}</span>
                    <span className="text-xs text-slate-500">{zone.provincias.join(', ')}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City */}
        <div className="space-y-2">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Select
            value={localFilters.ciudad ?? 'all'}
            onValueChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                ciudad: value === 'all' ? undefined : value,
                municipio: undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las ciudades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {availableCities?.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Municipality */}
        <div className="space-y-2">
          <Label htmlFor="municipio">Municipio</Label>
          <Select
            value={localFilters.municipio ?? 'all'}
            onValueChange={(value) =>
              setLocalFilters((prev) => ({
                ...prev,
                municipio: value === 'all' ? undefined : value,
              }))
            }
            disabled={!localFilters.ciudad}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos los municipios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los municipios</SelectItem>
              {municipios.map((municipio) => (
                <SelectItem key={municipio} value={municipio}>
                  {municipio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Waste Types */}
        <div className="space-y-2">
          <Label>Tipos de Residuos</Label>
          <div className="flex flex-wrap gap-2">
            {wasteTypes?.map((type) => (
              <Badge
                key={type.id}
                variant={
                  localFilters.wasteTypeIds?.includes(type.id)
                    ? 'default'
                    : 'outline'
                }
                className={cn(
                  'cursor-pointer transition-colors',
                  localFilters.wasteTypeIds?.includes(type.id)
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'hover:bg-slate-100'
                )}
                onClick={() => toggleWasteType(type.id)}
              >
                {type.nombre}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleApply} className="flex-1 bg-red-600 hover:bg-red-700">
            Aplicar
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
