'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Filter, X } from 'lucide-react'
import { ZONES } from '@/lib/constants/zones'
import { WASTE_SUBCATEGORY_SUGGESTIONS } from '@/lib/constants/waste-subcategories'
import type { WasteType } from '@/types/database'

// Flatten all subcategories into a unique sorted list
const ALL_SUBCATEGORIES = Array.from(
  new Set(Object.values(WASTE_SUBCATEGORY_SUGGESTIONS).flat())
).sort((a, b) => a.localeCompare(b, 'es'))

interface WasteItemFilters {
  subcategoria?: string
  waste_type_id?: number
  quality?: string
  zona?: number
}

interface WasteItemFilterPanelProps {
  wasteTypes: WasteType[]
  filters: WasteItemFilters
  onFiltersChange: (filters: WasteItemFilters) => void
}

const QUALITY_OPTIONS = [
  { value: 'Excelente', label: 'Excelente' },
  { value: 'Buena', label: 'Buena' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Baja', label: 'Baja' },
  { value: 'Deficiente', label: 'Deficiente' },
]

export function WasteItemFilterPanel({ wasteTypes, filters, onFiltersChange }: WasteItemFilterPanelProps) {
  const activeFilterCount = [
    filters.subcategoria,
    filters.waste_type_id,
    filters.quality,
    filters.zona,
  ].filter(Boolean).length

  const handleReset = () => {
    onFiltersChange({ subcategoria: undefined, waste_type_id: undefined, quality: undefined, zona: undefined })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeFilterCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">{activeFilterCount}</Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-slate-500">
              <X className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone filter */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Zona</Label>
          <Select
            value={filters.zona?.toString() || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, zona: value === 'all' ? undefined : parseInt(value) })
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todas las zonas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las zonas</SelectItem>
              {ZONES.map((zone) => (
                <SelectItem key={zone.id} value={zone.id.toString()}>
                  {zone.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Subcategory filter */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Subcategoría</Label>
          <Select
            value={filters.subcategoria || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, subcategoria: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todas las subcategorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las subcategorías</SelectItem>
              {ALL_SUBCATEGORIES.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Waste Type filter */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Tipo de Residuo</Label>
          <Select
            value={filters.waste_type_id?.toString() || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, waste_type_id: value === 'all' ? undefined : parseInt(value) })
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {wasteTypes.map((type) => (
                <SelectItem key={type.id} value={type.id.toString()}>
                  {type.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quality filter */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Calidad</Label>
          <Select
            value={filters.quality || 'all'}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, quality: value === 'all' ? undefined : value })
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todas las calidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las calidades</SelectItem>
              {QUALITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
