'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Search, Filter, X } from 'lucide-react'
import type { WasteType } from '@/types/database'

interface WasteItemFilters {
  search: string
  waste_type_id?: number
  quality?: string
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
    filters.search,
    filters.waste_type_id,
    filters.quality,
  ].filter(Boolean).length

  const handleReset = () => {
    onFiltersChange({ search: '', waste_type_id: undefined, quality: undefined })
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
        {/* Search */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Buscar subcategoría</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Ej: Computadora, Auto..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>

        {/* Waste Type filter */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Tipo de Residuo</Label>
          <div className="flex flex-wrap gap-1.5">
            {wasteTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    waste_type_id: filters.waste_type_id === type.id ? undefined : type.id,
                  })
                }}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  filters.waste_type_id === type.id
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {type.nombre}
              </button>
            ))}
          </div>
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
