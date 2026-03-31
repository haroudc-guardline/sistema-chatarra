'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
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

export interface StockFilters {
  search?: string
  estado?: string
  municipio?: string
  tipo_vehiculo?: string
  tipo_ac?: string
  tipo_herramienta?: string
}

interface StockFilterPanelProps {
  category: 'autos' | 'aires' | 'herramientas'
  filters: StockFilters
  municipios: string[]
  onFiltersChange: (filters: StockFilters) => void
}

const VEHICLE_TIPOS = ['Sedan', 'Camioneta', 'SUV', 'Bus', 'Camión', 'Motocicleta', 'Van', 'Otro']
const AC_TIPOS = ['Split', 'Central', 'Ventana', 'Portátil', 'Mini Split', 'Otro']
const TOOL_TIPOS = ['Taladro', 'Sierra', 'Esmeriladora', 'Compresor', 'Soldadora', 'Lijadora', 'Generador', 'Otro']
const VEHICLE_ESTADOS = ['Activo', 'En reparación', 'Fuera de servicio', 'Dado de baja']
const OTROS_ESTADOS = ['Operativo', 'En reparación', 'Fuera de servicio', 'Dado de baja']

export function StockFilterPanel({ category, filters, municipios, onFiltersChange }: StockFilterPanelProps) {
  const activeCount = Object.values(filters).filter(Boolean).length

  const handleReset = () => {
    onFiltersChange({})
  }

  const estados = category === 'autos' ? VEHICLE_ESTADOS : OTROS_ESTADOS
  const tipos = category === 'autos' ? VEHICLE_TIPOS : category === 'aires' ? AC_TIPOS : TOOL_TIPOS
  const tipoKey = category === 'autos' ? 'tipo_vehiculo' : category === 'aires' ? 'tipo_ac' : 'tipo_herramienta'
  const tipoLabel =
    category === 'autos' ? 'Tipo de Vehículo' : category === 'aires' ? 'Tipo de A/C' : 'Tipo de Herramienta'

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">{activeCount}</Badge>
            )}
          </CardTitle>
          {activeCount > 0 && (
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
          <Label className="text-xs text-slate-500">Buscar</Label>
          <Input
            placeholder={
              category === 'autos' ? 'Marca, modelo, placa...' :
              category === 'aires' ? 'Marca, modelo, serie...' :
              'Nombre, marca, modelo...'
            }
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined })}
            className="text-sm"
          />
        </div>

        {/* Municipio */}
        {municipios.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Municipio</Label>
            <Select
              value={filters.municipio || 'all'}
              onValueChange={(v) => onFiltersChange({ ...filters, municipio: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Todos los municipios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los municipios</SelectItem>
                {municipios.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Estado */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">Estado</Label>
          <Select
            value={filters.estado || 'all'}
            onValueChange={(v) => onFiltersChange({ ...filters, estado: v === 'all' ? undefined : v })}
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {estados.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category type */}
        <div className="space-y-2">
          <Label className="text-xs text-slate-500">{tipoLabel}</Label>
          <Select
            value={(filters as Record<string, string | undefined>)[tipoKey] || 'all'}
            onValueChange={(v) =>
              onFiltersChange({ ...filters, [tipoKey]: v === 'all' ? undefined : v })
            }
          >
            <SelectTrigger className="text-sm">
              <SelectValue placeholder={`Todos los tipos`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {tipos.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
