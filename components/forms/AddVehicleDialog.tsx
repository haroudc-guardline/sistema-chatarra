'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { stockItemService } from '@/lib/services/stock-item-service'
import { InstitutionSelect } from './InstitutionSelect'
import type { Location, StockVehicle } from '@/types/database'

const schema = z.object({
  location_id: z.number().min(1, 'La institución es requerida'),
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  anio: z.number().min(1900).max(2100, 'Año inválido'),
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
  estado: z.string().min(1),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddVehicleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  onSuccess: () => void
  editItem?: StockVehicle
}

export function AddVehicleDialog({ open, onOpenChange, locations, onSuccess, editItem }: AddVehicleDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = !!editItem

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
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
          estado: editItem.estado,
          notas: editItem.notas || '',
        }
      : { estado: 'Activo', anio: new Date().getFullYear() },
  })

  const watchedValues = {
    tipo_vehiculo: watch('tipo_vehiculo'),
    tipo_combustible: watch('tipo_combustible'),
    frecuencia_mantenimiento: watch('frecuencia_mantenimiento'),
    estado: watch('estado'),
    location_id: watch('location_id'),
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

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      // Clean empty strings to undefined to avoid DB CHECK constraint violations
      const cleaned = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === '' ? undefined : v])
      ) as any
      let vehicle: StockVehicle
      if (isEditing) {
        vehicle = await stockItemService.updateVehicle(editItem!.id, cleaned)
      } else {
        vehicle = await stockItemService.createVehicle(cleaned)
      }
      if (pendingFiles.length > 0) {
        await stockItemService.uploadPhotos('vehicle', vehicle.id, pendingFiles)
      }
      reset()
      setPendingFiles([])
      setPreviews([])
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Vehículo' : 'Agregar Vehículo'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Institución */}
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

          {/* Row: Marca, Modelo, Año */}
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
              <Label>Año <span className="text-red-500">*</span></Label>
              <Input {...register('anio', { valueAsNumber: true })} type="number" placeholder="2020" className={errors.anio ? 'border-red-500' : ''} />
              {errors.anio && <p className="text-xs text-red-500">{errors.anio.message}</p>}
            </div>
          </div>

          {/* Row: Placa, Color, Tipo */}
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
              <Label>Tipo de Vehículo</Label>
              <Select value={watchedValues.tipo_vehiculo || ''} onValueChange={(v) => setValue('tipo_vehiculo', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {['Sedan','Camioneta','SUV','Bus','Camión','Motocicleta','Van','Otro'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row: Combustible, N° Motor, N° Chasis */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Combustible</Label>
              <Select value={watchedValues.tipo_combustible || ''} onValueChange={(v) => setValue('tipo_combustible', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {['Gasolina','Diesel','Eléctrico','Híbrido','GLP'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Número de Motor</Label>
              <Input {...register('numero_motor')} placeholder="1234ABC" />
            </div>
            <div className="space-y-2">
              <Label>Número de Chasis</Label>
              <Input {...register('numero_chasis')} placeholder="XYZABC12345" />
            </div>
          </div>

          {/* Row: Póliza, Fecha Vencimiento Póliza */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Número de Póliza</Label>
              <Input {...register('numero_poliza')} placeholder="POL-2024-001" />
            </div>
            <div className="space-y-2">
              <Label>Fecha Vencimiento Póliza</Label>
              <Input {...register('fecha_vencimiento_poliza')} type="date" />
            </div>
          </div>

          {/* Row: Revisado, Frecuencia Mantenimiento */}
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

          {/* Ubicación */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Ubicación del Vehículo</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de Ubicación</Label>
                <Input {...register('ubicacion_nombre')} placeholder="Depósito Central" />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input {...register('ubicacion_direccion')} placeholder="Av. Principal, #123" />
              </div>
              <div className="space-y-2">
                <Label>Municipio</Label>
                <Input {...register('ubicacion_municipio')} placeholder="Panamá" />
              </div>
              <div className="space-y-2">
                <Label>Parroquia / Corregimiento</Label>
                <Input {...register('ubicacion_parroquia')} placeholder="Betania" />
              </div>
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={watchedValues.estado || 'Activo'} onValueChange={(v) => setValue('estado', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Activo','En reparación','Fuera de servicio','Dado de baja'].map((e) => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea {...register('notas')} placeholder="Observaciones adicionales..." rows={3} />
          </div>

          {/* Fotos */}
          <div className="space-y-3">
            <Label>Fotos</Label>
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Clic para subir fotos (máx. 10, 5MB c/u)</p>
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
                <span>Puedes agregar fotos después de crear el vehículo</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Agregar Vehículo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
