'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { PlacesAutocomplete } from '@/components/map/PlacesAutocomplete'
import { useLocations } from '@/hooks/useLocations'
import { locationService } from '@/lib/services/location-service'
import { Loader2, Plus } from 'lucide-react'
import type { Location } from '@/types/database'

interface InstitutionSelectProps {
  value?: number
  onChange: (locationId: number) => void
  onCreated?: () => void
  error?: boolean
  locations: Location[]
}

export function InstitutionSelect({ value, onChange, onCreated, error, locations }: InstitutionSelectProps) {
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const { cities } = useLocations()

  // New institution form state
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [nombreResponsable, setNombreResponsable] = useState('')
  const [telefono, setTelefono] = useState('')
  const [municipios, setMunicipios] = useState<string[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)

  useEffect(() => {
    if (!ciudad) { setMunicipios([]); return }
    setIsLoadingMunicipios(true)
    setMunicipio('')
    locationService.getMunicipios(ciudad)
      .then(setMunicipios)
      .catch(() => setMunicipios([]))
      .finally(() => setIsLoadingMunicipios(false))
  }, [ciudad])

  const handleCreate = async () => {
    if (!nombre.trim() || !direccion.trim() || !ciudad || !municipio || !nombreResponsable.trim()) {
      setCreateError('Completa los campos requeridos: nombre, dirección, ciudad, municipio, responsable')
      return
    }
    setIsCreating(true)
    setCreateError(null)
    try {
      const created = await locationService.createLocation({
        nombre_institucion: nombre.trim(),
        direccion: direccion.trim(),
        latitud: 8.538,
        longitud: -80.782,
        ciudad,
        municipio,
        nombre_responsable: nombreResponsable.trim(),
        contacto_responsable: telefono || '',
        telefono_responsable: telefono || undefined,
      } as any)
      onChange(created.id)
      onCreated?.()
      resetForm()
      setShowNewDialog(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear institución')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setNombre('')
    setDireccion('')
    setCiudad('')
    setMunicipio('')
    setNombreResponsable('')
    setTelefono('')
    setCreateError(null)
  }

  return (
    <>
      <Select
        value={value?.toString() || ''}
        onValueChange={(v) => {
          if (v === '__new__') {
            setShowNewDialog(true)
          } else {
            onChange(parseInt(v))
          }
        }}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Seleccionar institución" />
        </SelectTrigger>
        <SelectContent>
          {locations.map((l) => (
            <SelectItem key={l.id} value={l.id.toString()}>{l.nombre_institucion}</SelectItem>
          ))}
          <SelectItem value="__new__" className="text-blue-600 font-medium">
            <span className="flex items-center gap-1"><Plus className="h-3.5 w-3.5" /> Agregar nueva institución</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={showNewDialog} onOpenChange={(open) => { setShowNewDialog(open); if (!open) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Institución</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{createError}</div>
            )}

            <div className="space-y-2">
              <Label>Nombre de la Institución *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Ministerio de Ambiente" />
            </div>

            <div className="space-y-2">
              <Label>Dirección *</Label>
              <PlacesAutocomplete
                value={direccion}
                onChange={setDireccion}
                onPlaceSelect={(place) => setDireccion(place.address)}
                placeholder="Escribe para buscar dirección..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provincia / Ciudad *</Label>
                <Select value={ciudad} onValueChange={setCiudad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Municipio *</Label>
                <Select value={municipio} onValueChange={setMunicipio} disabled={!ciudad || isLoadingMunicipios}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingMunicipios ? 'Cargando...' : 'Seleccionar'} />
                  </SelectTrigger>
                  <SelectContent>
                    {municipios.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsable *</Label>
                <Input value={nombreResponsable} onChange={(e) => setNombreResponsable(e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Número de teléfono" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Institución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
