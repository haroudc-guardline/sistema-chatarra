'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLocations } from '@/hooks/useLocations'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapComponent } from '@/components/map/MapComponent'
import { PlacesAutocomplete } from '@/components/map/PlacesAutocomplete'
import { FileUpload } from './FileUpload'
import { CreatableWasteTypeSelect } from '@/components/waste/CreatableWasteTypeSelect'
import { Loader2, MapPin, Search } from 'lucide-react'
import type { Location, LocationWithDetails } from '@/types/database'
import { locationService } from '@/lib/services/location-service'

const locationSchema = z.object({
  nombre_institucion: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  latitud: z.number().min(-90).max(90, 'Latitud inválida'),
  longitud: z.number().min(-180).max(180, 'Longitud inválida'),
  ciudad: z.string().min(1, 'La ciudad es requerida'),
  municipio: z.string().min(1, 'El municipio es requerido'),
  corregimiento: z.string().optional(),
  volumen: z.number().min(0, 'El volumen debe ser positivo'),
  peso_estimado: z.number().min(0, 'El peso debe ser positivo'),
  costo_valor: z.number().min(0, 'El valor debe ser positivo'),
  telefono_responsable: z.string().min(1, 'El teléfono es requerido'),
  email_responsable: z.string().email('Email inválido').optional().or(z.literal('')),
  nombre_responsable: z.string().min(1, 'El nombre del responsable es requerido'),
  waste_type_ids: z.array(z.number()).min(1, 'Selecciona al menos un tipo de residuo'),
})

type LocationFormData = z.infer<typeof locationSchema>

interface LocationFormProps {
  mode: 'create' | 'edit'
  initialData?: LocationWithDetails
  onSubmit: (data: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  isSubmitting?: boolean
}

export function LocationForm({ mode, initialData, onSubmit, isSubmitting }: LocationFormProps) {
  const router = useRouter()
  const { wasteTypes, cities, createWasteType } = useLocations()
  const [municipios, setMunicipios] = useState<string[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number } | null>(
    initialData ? { lat: initialData.latitud, lng: initialData.longitud } : null
  )
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      nombre_institucion: initialData?.nombre_institucion || '',
      direccion: initialData?.direccion || '',
      latitud: initialData?.latitud || 8.538,
      longitud: initialData?.longitud || -80.782,
      ciudad: initialData?.ciudad || '',
      municipio: initialData?.municipio || '',
      corregimiento: initialData?.corregimiento || '',
      volumen: initialData?.volumen || 0,
      peso_estimado: initialData?.peso_estimado || 0,
      costo_valor: initialData?.costo_valor || 0,
      telefono_responsable: initialData?.telefono_responsable || initialData?.contacto_responsable || '',
      email_responsable: initialData?.email_responsable || '',
      nombre_responsable: initialData?.nombre_responsable || '',
      waste_type_ids: initialData?.waste_types?.map((wt) => wt.id) || [],
    },
  })

  // Watch ciudad at component level so useEffect reacts properly
  const watchedCiudad = form.watch('ciudad')

  // Load municipalities when city changes
  useEffect(() => {
    if (!watchedCiudad) {
      setMunicipios([])
      return
    }
    setIsLoadingMunicipios(true)
    // Reset municipio when city changes (unless editing an existing location in same city)
    const currentMunicipio = form.getValues('municipio')
    if (!initialData || initialData.ciudad !== watchedCiudad) {
      form.setValue('municipio', '')
    }
    const load = async () => {
      try {
        const data = await locationService.getMunicipios(watchedCiudad)
        setMunicipios(data)
        // If editing and the stored municipio is in the list, keep it
        if (initialData && initialData.ciudad === watchedCiudad && currentMunicipio) {
          form.setValue('municipio', currentMunicipio)
        }
      } catch (e) {
        console.error('Error loading municipios:', e)
        setMunicipios([])
      } finally {
        setIsLoadingMunicipios(false)
      }
    }
    load()
  }, [watchedCiudad])

  const handleGeocode = async () => {
    const direccion = form.getValues('direccion')
    if (!direccion) return

    setIsGeocoding(true)
    setGeocodeError(null)

    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: direccion }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      form.setValue('latitud', data.lat)
      form.setValue('longitud', data.lng)
      setSelectedPosition({ lat: data.lat, lng: data.lng })
    } catch (error) {
      setGeocodeError('No se pudo geocodificar la dirección. Intenta con otra dirección.')
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat()
      const lng = e.latLng.lng()
      form.setValue('latitud', lat)
      form.setValue('longitud', lng)
      setSelectedPosition({ lat, lng })
    }
  }

  const toggleWasteType = (id: number) => {
    const current = form.getValues('waste_type_ids')
    const updated = current.includes(id)
      ? current.filter((tid) => tid !== id)
      : [...current, id]
    form.setValue('waste_type_ids', updated)
  }

  const handleSubmit = async (data: LocationFormData) => {
    await onSubmit({
      ...data,
      corregimiento: data.corregimiento || undefined,
    } as Omit<Location, 'id' | 'created_at' | 'updated_at'>)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {geocodeError && (
          <Alert variant="destructive">
            <AlertDescription>{geocodeError}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre_institucion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Institución *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Ministerio de Ambiente" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección *</FormLabel>
                      <FormControl>
                        <PlacesAutocomplete
                          value={field.value}
                          onChange={field.onChange}
                          onPlaceSelect={(place) => {
                            // Auto-fill coordinates when place is selected
                            form.setValue('latitud', place.lat)
                            form.setValue('longitud', place.lng)
                            setSelectedPosition({ lat: place.lat, lng: place.lng })
                            // Also update the address field with the formatted address
                            field.onChange(place.address)
                          }}
                          placeholder="Escribe para buscar dirección..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ciudad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Provincia / Ciudad *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar provincia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities?.map((city) => (
                              <SelectItem key={city} value={city}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="municipio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Municipio *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!watchedCiudad || isLoadingMunicipios}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  !watchedCiudad
                                    ? 'Selecciona una ciudad primero'
                                    : isLoadingMunicipios
                                    ? 'Cargando...'
                                    : 'Seleccionar municipio'
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {municipios.map((municipio) => (
                              <SelectItem key={municipio} value={municipio}>
                                {municipio}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {watchedCiudad && !isLoadingMunicipios && municipios.length === 0 && (
                          <p className="text-xs text-amber-600 mt-1">
                            No se encontraron municipios para esta ciudad.
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="corregimiento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corregimiento</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Opcional" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsable</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nombre_responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Responsable *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nombre completo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono_responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Número de teléfono" type="tel" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_responsable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="correo@ejemplo.com" type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Map */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles del Residuo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="volumen"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volumen (m³) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="peso_estimado"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso (kg) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="costo_valor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor ($) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="waste_type_ids"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipos de Residuos *</FormLabel>
                      <FormControl>
                        <CreatableWasteTypeSelect
                          wasteTypes={wasteTypes || []}
                          selectedIds={field.value}
                          onChange={field.onChange}
                          onCreateWasteType={createWasteType}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ubicación en el Mapa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitud"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitud</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value))
                                setSelectedPosition({
                                  lat: parseFloat(e.target.value),
                                  lng: form.getValues('longitud'),
                                })
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitud"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitud</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.000001"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseFloat(e.target.value))
                                setSelectedPosition({
                                  lat: form.getValues('latitud'),
                                  lng: parseFloat(e.target.value),
                                })
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="h-[280px] rounded-lg overflow-hidden border border-slate-200">
                    <MapComponent
                      locations={selectedPosition ? [{
                        id: 0,
                        nombre_institucion: 'Ubicación seleccionada',
                        direccion: form.getValues('direccion') || '',
                        latitud: selectedPosition.lat,
                        longitud: selectedPosition.lng,
                        ciudad: '',
                        municipio: '',
                        volumen: 0,
                        peso_estimado: 0,
                        costo_valor: 0,
                        contacto_responsable: '',
                        nombre_responsable: '',
                        created_at: '',
                      } as LocationWithDetails] : []}
                      onMapClick={handleMapClick}
                      draggableMarker={!!selectedPosition}
                      onMarkerDragEnd={(lat, lng) => {
                        form.setValue('latitud', lat)
                        form.setValue('longitud', lng)
                        setSelectedPosition({ lat, lng })
                      }}
                      height="100%"
                    />
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    Haz clic en el mapa para posicionar, o <strong>arrastra el marcador azul</strong> para ajustar con precisión
                  </p>
                </div>
              </CardContent>
            </Card>

            {mode === 'create' && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    onFilesSelected={setUploadedFiles}
                    acceptedTypes={['image/*', '.pdf', '.doc', '.docx']}
                    maxFiles={5}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : mode === 'create' ? (
              'Crear Ubicación'
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
