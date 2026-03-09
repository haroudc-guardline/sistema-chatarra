'use client'

import { useState } from 'react'
import { useLocations } from '@/hooks/useLocations'
import { MapComponent } from '@/components/map/MapComponent'
import { FilterPanel } from '@/components/data/FilterPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X, MapPin, SlidersHorizontal } from 'lucide-react'
import type { LocationWithDetails } from '@/types/database'
import Link from 'next/link'

export default function MapPage() {
  const [filters, setFilters] = useState<{
    ciudad?: string
    municipio?: string
    search?: string
    wasteTypeIds?: number[]
  }>({})
  const [selectedLocation, setSelectedLocation] = useState<LocationWithDetails | null>(null)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const { locations, isLoading } = useLocations(filters)

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Sidebar / Filter Panel */}
      <div className={`
        lg:w-80 flex-shrink-0
        ${showMobileFilters ? 'block' : 'hidden lg:block'}
      `}>
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
        />

        {/* Location Dropdown */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Seleccionar Ubicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-slate-500 text-center py-4">
                Cargando...
              </p>
            ) : locations?.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No hay ubicaciones que coincidan con los filtros
              </p>
            ) : (
              <Select
                value={selectedLocation?.id?.toString() || ''}
                onValueChange={(value) => {
                  const location = locations?.find((l) => l.id.toString() === value)
                  setSelectedLocation(location || null)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Selecciona una ubicación (${locations?.length || 0} disponibles)`} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {locations?.map((location) => (
                    <SelectItem
                      key={location.id}
                      value={location.id.toString()}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col py-1">
                        <span className="font-medium">{location.nombre_institucion}</span>
                        <span className="text-xs text-slate-500">
                          {location.ciudad}, {location.municipio}
                          {location.waste_types && location.waste_types.length > 0 && (
                            <span className="ml-2">
                              • {location.waste_types.length} tipo(s)
                            </span>
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Selected Location Info */}
            {selectedLocation && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-red-950 text-sm">
                      {selectedLocation.nombre_institucion}
                    </p>
                    <p className="text-xs text-red-800 mt-1">
                      {selectedLocation.direccion}
                    </p>
                    <p className="text-xs text-red-700">
                      {selectedLocation.ciudad}, {selectedLocation.municipio}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-800 hover:text-red-950 hover:bg-red-100"
                    onClick={() => setSelectedLocation(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {selectedLocation.waste_types && selectedLocation.waste_types.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedLocation.waste_types.map((wt) => (
                      <Badge
                        key={wt.id}
                        variant="secondary"
                        className="text-xs bg-red-100 text-red-900"
                      >
                        {wt.nombre}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3 text-xs border-red-300 text-red-800 hover:bg-red-100"
                  asChild
                >
                  <Link href={`/locations/${selectedLocation.id}`}>
                    Ver detalles
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        {/* Mobile Filter Toggle */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute top-4 left-4 z-10 lg:hidden"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          {showMobileFilters ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cerrar
            </>
          ) : (
            <>
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </>
          )}
        </Button>

        <MapComponent
          locations={locations || []}
          selectedLocation={selectedLocation}
          onMarkerClick={setSelectedLocation}
          height="100%"
        />

        {/* Empty state overlay when filters return no results */}
        {!isLoading && (locations?.length === 0) && Object.values(filters).some(Boolean) && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center max-w-sm mx-4 pointer-events-auto">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 mx-auto mb-4">
                <SlidersHorizontal className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-slate-800 font-semibold text-lg">Sin resultados</p>
              <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                Ninguna ubicación coincide con los filtros aplicados. Prueba ajustando los criterios de búsqueda.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
