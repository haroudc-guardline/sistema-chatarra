'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import type { Location, StockVehicle } from '@/types/database'

const schema = z.object({
  location_id: z.number().min(1, 'La institucion es requerida'),
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  anio: z.number().min(1900).max(2100, 'Ano invalido'),
  placa: z.string().min(1, 'La placa es requerida'),
  numero_motor: z.string().optional(),
  numero_chasis: z.string().optional(),
  color: z.string().optional(),
  tipo_vehiculo: z.string().optional(),
  tipo_combustible: z.string().optional(),
  numero_poliza: z.string().optional(),
  fecha_vencimiento_poliza: z.string().optional(),
  fecha_revisado: z.string().optional(),
  frecuencia_mantenimiento: z.string().optional(),
  ubicacion_nombre: z.string().optional(),
  ubicacion_direccion: z.string().optional(),
  ubicacion_municipio: z.string().optional(),
  ubicacion_parroquia: z.string().optional(),
  tipo_activo: z.string().optional(),
  valor: z.number().optional(),
  codigo_marbete: z.string().optional(),
  tiene_avaluo: z.boolean().optional(),
  precio_avaluo: z.number().optional(),
  responsable_nombre: z.string().optional(),
  responsable_telefono: z.string().optional(),
  responsable_email: z.string().email('Email invalido').optional().or(z.literal('')),
  estado: z.string().min(1),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface VehicleFormProps {
  locations: Location[]
  onSubmit: (data: any, files: File[]) => Promise<void>
  onCancel: () => void
  editItem?: StockVehicle
  isSubmitting?: boolean
}

export function VehicleForm({ locations, onSubmit, onCancel, editItem, isSubmitting = false }: VehicleFormProps) {
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!editItem

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editItem
      ? {
          location_id: editItem.location_id,
          marca: editItem.marca,
          modelo: editItem.modelo,
          anio: editItem.anio,
          placa: editItem.placa,
          numero_motor: editItem.numero_motor || '',
          numero_chasis: editItem.numero_chasis || '',
          color: editItem.color || '',
          tipo_vehiculo: editItem.tipo_vehiculo || '',
          tipo_combustible: editItem.tipo_combustible || '',
          numero_poliza: editItem.numero_poliza || '',
          fecha_vencimiento_poliza: editItem.fecha_vencimiento_poliza || '',
          fecha_revisado: editItem.fecha_revisado || '',
          frecuencia_mantenimiento: editItem.frecuencia_mantenimiento || '',
          ubicacion_nombre: editItem.ubicacion_nombre || '',
          ubicacion_direccion: editItem.ubicacion_direccion || '',
          ubicacion_municipio: editItem.ubicacion_municipio || '',
          ubicacion_parroquia: editItem.ubicacion_parroquia || '',
          tipo_activo: editItem.tipo_activo || '',
          valor: editItem.valor ?? undefined,
          codigo_marbete: editItem.codigo_marbete || '',
          tiene_avaluo: editItem.tiene_avaluo ?? false,
          precio_avaluo: editItem.precio_avaluo ?? undefined,
          responsable_nombre: editItem.responsable_nombre || '',
          responsable_telefono: editItem.responsable_telefono || '',
          responsable_email: editItem.responsable_email || '',
          estado: editItem.estado,
          notas: editItem.notas || '',
        }
      : { estado: 'Activo', anio: new Date().getFullYear(), tiene_avaluo: false },
  })

  const watchedValues = {
    tipo_vehiculo: watch('tipo_vehiculo'),
    tipo_combustible: watch('tipo_combustible'),
    frecuencia_mantenimiento: watch('frecuencia_mantenimiento'),
    estado: watch('estado'),
    location_id: watch('location_id'),
    tipo_activo: watch('tipo_activo'),
    tiene_avaluo: watch('tiene_avaluo'),
  }

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
    await onSubmit(data, pendingFiles)
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT COLUMN ===== */}
        <div className="space-y-6">
          {/* Institucion */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Institucion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>Institucion <span className="text-red-500">*</span></Label>
                <Select
                  value={watchedValues.location_id?.toString() || ''}
                  onValueChange={(v) => setValue('location_id', parseInt(v))}
                >
                  <SelectTrigger className={errors.location_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleccionar institucion" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.nombre_institucion}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.location_id && <p className="text-xs text-red-500">{errors.location_id.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Informacion Basica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informacion Basica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Marca, Modelo, Ano */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Marca <span className="text-red-500">*</span></Label>
                  <Input {...register('marca')} placeholder="Toyota" className={errors.marca ? 'border-red-500' : ''} />
                  {errors.marca && <p className="text-xs text-red-500">{errors.marca.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Modelo <span className="text-red-500">*</span></Label>
                  <Input {...register('modelo')} placeholder="Corolla" className={errors.modelo ? 'border-red-500' : ''} />
                  {errors.modelo && <p className="text-xs text-red-500">{errors.modelo.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Ano <span className="text-red-500">*</span></Label>
                  <Input {...register('anio', { valueAsNumber: true })} type="number" placeholder="2020" className={errors.anio ? 'border-red-500' : ''} />
                  {errors.anio && <p className="text-xs text-red-500">{errors.anio.message}</p>}
                </div>
              </div>

              {/* Placa, Color, Tipo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Placa <span className="text-red-500">*</span></Label>
                  <Input {...register('placa')} placeholder="ABC-123" className={errors.placa ? 'border-red-500' : ''} />
                  {errors.placa && <p className="text-xs text-red-500">{errors.placa.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input {...register('color')} placeholder="Blanco" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Vehiculo</Label>
                  <Select value={watchedValues.tipo_vehiculo || ''} onValueChange={(v) => setValue('tipo_vehiculo', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent>
                      {['Sedan','Camioneta','SUV','Bus','Camion','Motocicleta','Van','Otro'].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Combustible, Motor, Chasis */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Combustible</Label>
                  <Select value={watchedValues.tipo_combustible || ''} onValueChange={(v) => setValue('tipo_combustible', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {['Gasolina','Diesel','Electrico','Hibrido','GLP'].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Numero de Motor</Label>
                  <Input {...register('numero_motor')} placeholder="1234ABC" />
                </div>
                <div className="space-y-2">
                  <Label>Numero de Chasis</Label>
                  <Input {...register('numero_chasis')} placeholder="XYZABC12345" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Poliza y Mantenimiento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Poliza y Mantenimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Numero de Poliza</Label>
                  <Input {...register('numero_poliza')} placeholder="POL-2024-001" />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Vencimiento Poliza</Label>
                  <Input {...register('fecha_vencimiento_poliza')} type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha de Revisado</Label>
                  <Input {...register('fecha_revisado')} type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Frecuencia de Mantenimiento</Label>
                  <Select value={watchedValues.frecuencia_mantenimiento || ''} onValueChange={(v) => setValue('frecuencia_mantenimiento', v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger>
                    <SelectContent>
                      {['Mensual','Trimestral','Semestral','Anual'].map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    {['Activo','En reparacion','Fuera de servicio','Dado de baja'].map((e) => (
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
                <Select value={watchedValues.tipo_activo || ''} onValueChange={(v) => setValue('tipo_activo', v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar tipo de activo" /></SelectTrigger>
                  <SelectContent>
                    {['Activo nuevo', 'Activo usado', 'Activo por Permuta y Donacion'].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  {...register('valor', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  placeholder="$0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Código de Marbete</Label>
                <Input {...register('codigo_marbete')} placeholder="Ej: MRB-2026-001" />
              </div>

              {watchedValues.tipo_activo === 'Activo usado' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tiene_avaluo">Tiene avaluo</Label>
                    <Switch
                      id="tiene_avaluo"
                      checked={watchedValues.tiene_avaluo || false}
                      onCheckedChange={(checked) => setValue('tiene_avaluo', checked)}
                    />
                  </div>

                  {watchedValues.tiene_avaluo && (
                    <div className="space-y-2">
                      <Label>Precio de Avaluo</Label>
                      <Input
                        {...register('precio_avaluo', { valueAsNumber: true })}
                        type="number"
                        step="0.01"
                        placeholder="$0.00"
                      />
                    </div>
                  )}
                </div>
              )}
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

          {/* Ubicacion del Vehiculo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ubicacion del Vehiculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de Ubicacion</Label>
                  <Input {...register('ubicacion_nombre')} placeholder="Deposito Central" />
                </div>
                <div className="space-y-2">
                  <Label>Direccion</Label>
                  <Input {...register('ubicacion_direccion')} placeholder="Av. Principal, #123" />
                </div>
                <div className="space-y-2">
                  <Label>Municipio</Label>
                  <Input {...register('ubicacion_municipio')} placeholder="Panama" />
                </div>
                <div className="space-y-2">
                  <Label>Parroquia / Corregimiento</Label>
                  <Input {...register('ubicacion_parroquia')} placeholder="Betania" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fotos</CardTitle>
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
                  <span>Puedes agregar fotos despues de crear el vehiculo</span>
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
          {isEditing ? 'Guardar Cambios' : 'Agregar Vehiculo'}
        </Button>
      </div>
    </form>
  )
}
