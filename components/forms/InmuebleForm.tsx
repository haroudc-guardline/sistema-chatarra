'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { InstitutionSelect } from './InstitutionSelect'
import { PlacesAutocomplete } from '@/components/map/PlacesAutocomplete'
import { useLocations } from '@/hooks/useLocations'
import { locationService } from '@/lib/services/location-service'
import { useInmuebleTypes, useInmuebleTypeMutations, useInmuebleActivoTypes, useInmuebleActivoTypeMutations } from '@/hooks/useInmuebles'
import { TITULAR_TIPOS } from '@/lib/inmueble-constants'
import type { Location, StockInmueble } from '@/types/database'

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  inmueble_type_id: z.number().min(1, 'El tipo de inmueble es requerido'),
  location_id: z.number().min(1, 'La institucion es requerida'),
  metros_cuadrados: z.number().optional(),
  avaluo: z.string().optional(),
  registro: z.string().optional(),
  planos_actualizados: z.string().optional(),
  estado: z.string().min(1),
  notas: z.string().optional(),
  activo_type_id: z.number().optional(),
  valor: z.number().optional(),
  valor_terreno: z.number().optional(),
  valor_catastral: z.number().optional(),
  valor_mejoras: z.number().optional(),
  titular_nombre: z.string().optional(),
  titular_tipo: z.string().optional(),
  ministerio: z.string().optional(),
  codigo_marbete: z.string().optional(),
  responsable_nombre: z.string().optional(),
  responsable_telefono: z.string().optional(),
  responsable_email: z.string().email('Email invalido').optional().or(z.literal('')),
  ubicacion_nombre: z.string().optional(),
  ubicacion_direccion: z.string().optional(),
  ubicacion_municipio: z.string().optional(),
  ubicacion_ciudad: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface InmuebleFormProps {
  locations: Location[]
  onSubmit: (data: any, files: File[]) => Promise<void>
  onCancel: () => void
  editItem?: StockInmueble
  isSubmitting?: boolean
}

export function InmuebleForm({ locations, onSubmit, onCancel, editItem, isSubmitting = false }: InmuebleFormProps) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showNewTypeInput, setShowNewTypeInput] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [showNewActivoTypeInput, setShowNewActivoTypeInput] = useState(false)
  const [newActivoTypeName, setNewActivoTypeName] = useState('')

  const { cities } = useLocations()
  const [municipios, setMunicipios] = useState<string[]>([])
  const [isLoadingMunicipios, setIsLoadingMunicipios] = useState(false)

  const { types: inmuebleTypes } = useInmuebleTypes()
  const { create: createType } = useInmuebleTypeMutations()
  const { types: activoTypes } = useInmuebleActivoTypes()
  const { create: createActivoType } = useInmuebleActivoTypeMutations()

  const isEditing = !!editItem

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editItem
      ? {
          nombre: editItem.nombre,
          inmueble_type_id: editItem.inmueble_type_id,
          location_id: editItem.location_id,
          metros_cuadrados: editItem.metros_cuadrados ?? undefined,
          avaluo: editItem.avaluo || '',
          registro: editItem.registro || '',
          planos_actualizados: editItem.planos_actualizados || '',
          estado: editItem.estado,
          notas: editItem.notas || '',
          activo_type_id: editItem.activo_type_id ?? undefined,
          valor: editItem.valor ?? undefined,
          valor_terreno: editItem.valor_terreno ?? undefined,
          valor_catastral: editItem.valor_catastral ?? undefined,
          valor_mejoras: editItem.valor_mejoras ?? undefined,
          titular_nombre: editItem.titular_nombre || '',
          titular_tipo: editItem.titular_tipo || '',
          ministerio: editItem.ministerio || '',
          codigo_marbete: editItem.codigo_marbete || '',
          responsable_nombre: editItem.responsable_nombre || '',
          responsable_telefono: editItem.responsable_telefono || '',
          responsable_email: editItem.responsable_email || '',
          ubicacion_nombre: editItem.ubicacion_nombre || '',
          ubicacion_direccion: editItem.ubicacion_direccion || '',
          ubicacion_municipio: editItem.ubicacion_municipio || '',
          ubicacion_ciudad: editItem.ubicacion_ciudad || '',
        }
      : { estado: 'Activo' },
  })

  const watchedValues = {
    inmueble_type_id: watch('inmueble_type_id'),
    location_id: watch('location_id'),
    avaluo: watch('avaluo'),
    registro: watch('registro'),
    planos_actualizados: watch('planos_actualizados'),
    estado: watch('estado'),
    activo_type_id: watch('activo_type_id'),
    titular_tipo: watch('titular_tipo'),
  }

  const watchedCiudad = watch('ubicacion_ciudad')

  useEffect(() => {
    if (!watchedCiudad) { setMunicipios([]); return }
    setIsLoadingMunicipios(true)
    locationService.getMunicipios(watchedCiudad)
      .then(setMunicipios)
      .catch(() => setMunicipios([]))
      .finally(() => setIsLoadingMunicipios(false))
  }, [watchedCiudad])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = [...pendingFiles, ...files].slice(0, 10)
    setPendingFiles(newFiles)
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f))
    setPreviews(newPreviews)
  }

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index])
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFormSubmit = async (data: FormData) => {
    // Clean empty strings to undefined so DB defaults apply and CHECK constraints pass
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
    )
    // Ensure estado always has a value
    if (!cleaned.estado) cleaned.estado = 'Activo'
    await onSubmit(cleaned, pendingFiles)
  }

  const handleAddNewType = async () => {
    if (!newTypeName.trim()) return
    try {
      const created = await createType.mutateAsync(newTypeName.trim())
      setValue('inmueble_type_id', created.id)
      setNewTypeName('')
      setShowNewTypeInput(false)
    } catch (err) {
      console.error('Error creating type:', err)
    }
  }

  const handleAddNewActivoType = async () => {
    if (!newActivoTypeName.trim()) return
    try {
      const created = await createActivoType.mutateAsync(newActivoTypeName.trim())
      setValue('activo_type_id', created.id)
      setNewActivoTypeName('')
      setShowNewActivoTypeInput(false)
    } catch (err) {
      console.error('Error creating activo type:', err)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-6">
          {/* Informacion Basica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion Basica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre <span className="text-red-500">*</span></Label>
                <Input {...register('nombre')} placeholder="Nombre del inmueble" className={errors.nombre ? 'border-red-500' : ''} />
                {errors.nombre && <p className="text-xs text-red-500">{errors.nombre.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Tipo de Inmueble <span className="text-red-500">*</span></Label>
                {showNewTypeInput ? (
                  <div className="flex gap-2">
                    <Input
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      placeholder="Nombre del nuevo tipo"
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={handleAddNewType} disabled={createType.isPending}>
                      {createType.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewTypeInput(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={watchedValues.inmueble_type_id?.toString() || ''}
                    onValueChange={(v) => {
                      if (v === '__new__') {
                        setShowNewTypeInput(true)
                      } else {
                        setValue('inmueble_type_id', parseInt(v))
                      }
                    }}
                  >
                    <SelectTrigger className={errors.inmueble_type_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleccionar tipo de inmueble" />
                    </SelectTrigger>
                    <SelectContent>
                      {inmuebleTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-blue-600 font-medium">+ Agregar nuevo tipo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                {errors.inmueble_type_id && <p className="text-xs text-red-500">{errors.inmueble_type_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Institución <span className="text-red-500">*</span></Label>
                <InstitutionSelect
                  value={watchedValues.location_id}
                  onChange={(id) => setValue('location_id', id)}
                  error={!!errors.location_id}
                  locations={locations}
                />
                {errors.location_id && <p className="text-xs text-red-500">{errors.location_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Metros Cuadrados</Label>
                <Input {...register('metros_cuadrados', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" />
              </div>
            </CardContent>
          </Card>

          {/* Titular y Ministerio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Titular y Ministerio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>A nombre de (titular registral)</Label>
                <Input {...register('titular_nombre')} placeholder="Nombre del titular / propietario" />
              </div>
              <div className="space-y-2">
                <Label>Tipo de titular</Label>
                <Select value={watchedValues.titular_tipo || ''} onValueChange={(v) => setValue('titular_tipo', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {TITULAR_TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ministerio</Label>
                <Input {...register('ministerio')} placeholder="Ministerio o entidad afiliada" />
              </div>
            </CardContent>
          </Card>

          {/* Estado Legal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado Legal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Avaluo</Label>
                <Select value={watchedValues.avaluo || ''} onValueChange={(v) => setValue('avaluo', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {['Si', 'No', 'En proceso'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Registro</Label>
                <Select value={watchedValues.registro || ''} onValueChange={(v) => setValue('registro', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {['Si', 'No', 'En proceso'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Planos Actualizados</Label>
                <Select value={watchedValues.planos_actualizados || ''} onValueChange={(v) => setValue('planos_actualizados', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {['Si', 'No', 'En proceso'].map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Estado y Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estado y Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={watchedValues.estado || 'Activo'} onValueChange={(v) => setValue('estado', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['Activo', 'En reparacion', 'Fuera de servicio', 'Dado de baja'].map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea {...register('notas')} placeholder="Observaciones adicionales..." rows={3} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="space-y-6">
          {/* Tipo de Activo y Valoracion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tipo de Activo y Valoracion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Activo</Label>
                {showNewActivoTypeInput ? (
                  <div className="flex gap-2">
                    <Input
                      value={newActivoTypeName}
                      onChange={(e) => setNewActivoTypeName(e.target.value)}
                      placeholder="Nombre del nuevo tipo de activo"
                      className="flex-1"
                    />
                    <Button type="button" size="sm" onClick={handleAddNewActivoType} disabled={createActivoType.isPending}>
                      {createActivoType.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agregar'}
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewActivoTypeInput(false)}>
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <Select
                    value={watchedValues.activo_type_id?.toString() || ''}
                    onValueChange={(v) => {
                      if (v === '__new__') {
                        setShowNewActivoTypeInput(true)
                      } else {
                        setValue('activo_type_id', parseInt(v))
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo de activo" /></SelectTrigger>
                    <SelectContent>
                      {activoTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-blue-600 font-medium">+ Agregar nuevo tipo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Valor (general)</Label>
                <Input
                  {...register('valor', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="$0.00"
                />
                <p className="text-xs text-slate-400">Si registras un avalúo, ese monto manda en los totales.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor de la tierra</Label>
                  <Input {...register('valor_terreno', { valueAsNumber: true })} type="number" step="0.01" placeholder="$0.00" />
                </div>
                <div className="space-y-2">
                  <Label>Valor catastral</Label>
                  <Input {...register('valor_catastral', { valueAsNumber: true })} type="number" step="0.01" placeholder="$0.00" />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Valor de mejoras (edificio)</Label>
                  <Input {...register('valor_mejoras', { valueAsNumber: true })} type="number" step="0.01" placeholder="$0.00" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Codigo de Marbete</Label>
                <Input {...register('codigo_marbete')} placeholder="MAR-001" />
              </div>
            </CardContent>
          </Card>

          {/* Responsable del Activo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responsable del Activo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...register('responsable_nombre')} placeholder="Nombre completo" />
              </div>
              <div className="space-y-2">
                <Label>Telefono</Label>
                <Input {...register('responsable_telefono')} type="tel" placeholder="+507 6000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register('responsable_email')} type="email" placeholder="correo@ejemplo.com" />
                {errors.responsable_email && <p className="text-xs text-red-500">{errors.responsable_email.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Ubicacion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ubicación del Inmueble</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de Ubicación</Label>
                <Input {...register('ubicacion_nombre')} placeholder="Edificio Central" />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <PlacesAutocomplete
                  value={watch('ubicacion_direccion') || ''}
                  onChange={(val) => setValue('ubicacion_direccion', val)}
                  onPlaceSelect={(place) => {
                    setValue('ubicacion_direccion', place.address)
                  }}
                  placeholder="Escribe para buscar dirección..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provincia / Ciudad</Label>
                  <Select
                    value={watchedCiudad || ''}
                    onValueChange={(v) => {
                      setValue('ubicacion_ciudad', v)
                      setValue('ubicacion_municipio', '')
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar provincia" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities?.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Municipio</Label>
                  <Select
                    value={watch('ubicacion_municipio') || ''}
                    onValueChange={(v) => setValue('ubicacion_municipio', v)}
                    disabled={!watchedCiudad || isLoadingMunicipios}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={!watchedCiudad ? 'Selecciona ciudad primero' : isLoadingMunicipios ? 'Cargando...' : 'Seleccionar municipio'} />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fotos / Documentos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos / Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Clic para subir fotos (max. 10, 5MB c/u)</p>
                <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP, HEIC</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="hidden"
                onChange={handleFileChange}
              />
              {previews.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {previews.map((src, i) => (
                    <div key={i} className="relative group">
                      <img src={src} alt="" className="w-full h-20 object-cover rounded-lg border" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {pendingFiles.length === 0 && !isEditing && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Puedes agregar fotos despues de crear el inmueble</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Guardar Cambios' : 'Agregar Inmueble'}
        </Button>
      </div>
    </form>
  )
}
