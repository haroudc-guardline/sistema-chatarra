'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocations } from '@/hooks/useLocations'
import { useAuth } from '@/hooks/useAuth'
import { DataTable } from '@/components/data/DataTable'
import { FilterPanel } from '@/components/data/FilterPanel'
import { LocationsBreadcrumbs } from '@/components/navigation/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Download, Trash2, Edit, Eye, FileSpreadsheet, AlertTriangle, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { LocationWithDetails } from '@/types/database'

export default function LocationsPage() {
  const router = useRouter()
  const { isOperador, isAdmin } = useAuth()
  const [filters, setFilters] = useState<{
    ciudad?: string
    municipio?: string
    search?: string
    wasteTypeIds?: number[]
  }>({})
  const [locationToDelete, setLocationToDelete] = useState<LocationWithDetails | null>(null)
  const { locations, isLoading, deleteLocation, isDeleting } = useLocations(filters)

  const handleExport = (detailed: boolean = false) => {
    const url = detailed 
      ? '/api/export/locations?detailed=true&format=excel'
      : '/api/export/locations'
    window.open(url, '_blank')
  }

  const handleDelete = async () => {
    if (!locationToDelete) return
    await deleteLocation(locationToDelete.id)
    setLocationToDelete(null)
  }

  const columns = [
    {
      key: 'nombre_institucion',
      header: 'Institución',
      cell: (location: LocationWithDetails) => (
        <div>
          <p className="font-medium text-slate-900">{location.nombre_institucion}</p>
          <p className="text-sm text-slate-500">{location.direccion}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'ciudad',
      header: 'Ubicación',
      cell: (location: LocationWithDetails) => (
        <div className="text-sm">
          <p>{location.ciudad}</p>
          <p className="text-slate-500">{location.municipio}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'volumen',
      header: 'Volumen',
      cell: (location: LocationWithDetails) => (
        <span className="text-sm">{location.volumen} m³</span>
      ),
      sortable: true,
    },
    {
      key: 'waste_types',
      header: 'Tipos',
      cell: (location: LocationWithDetails) => (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {location.waste_types?.slice(0, 2).map((wt) => (
            <Badge key={wt.id} variant="secondary" className="text-xs">
              {wt.nombre}
            </Badge>
          ))}
          {location.waste_types && location.waste_types.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{location.waste_types.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
  ]

  const rowActions = (location: LocationWithDetails) => (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/locations/${location.id}`)}
            >
              <Eye className="h-4 w-4 text-slate-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ver detalles</p>
          </TooltipContent>
        </Tooltip>

        {isOperador && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/locations/${location.id}/edit`)}
              >
                <Edit className="h-4 w-4 text-blue-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar ubicación</p>
            </TooltipContent>
          </Tooltip>
        )}

        {isAdmin && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLocationToDelete(location)}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar ubicación</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <LocationsBreadcrumbs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ubicaciones</h1>
          <p className="text-slate-500 mt-1">
            Gestiona las instituciones con residuos registradas
          </p>
        </div>
        <div className="flex gap-2">
          {isOperador && (
            <Link href="/locations/new">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Ubicación
              </Button>
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport(false)}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar resumen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport(true)}>
                <Download className="mr-2 h-4 w-4" />
                Exportar con detalle de residuos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="lg:col-span-1">
          <FilterPanel filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Table */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Ubicaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={locations || []}
                columns={columns}
                isLoading={isLoading}
                keyExtractor={(location) => location.id}
                emptyMessage="No hay ubicaciones registradas"
                onRowClick={(location) => router.push(`/locations/${location.id}`)}
                rowActions={rowActions}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!locationToDelete} onOpenChange={() => setLocationToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Confirmar Eliminación</DialogTitle>
            </div>
            <DialogDescription className="text-base">
              ¿Estás seguro de que deseas eliminar la ubicación <strong>&quot;{locationToDelete?.nombre_institucion}&quot;</strong>?
              <br /><br />
              Esta acción eliminará todos los datos asociados y <strong>no se puede deshacer</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocationToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
