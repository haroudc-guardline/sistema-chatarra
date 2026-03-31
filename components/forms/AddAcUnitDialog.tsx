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
import type { Location, StockAcUnit } from '@/types/database'

const schema = z.object({
  location_id: z.number({ coerce: true }).min(1, 'La institución es requerida'),
  marca: z.string().min(1, 'La marca es requerida'),
  modelo: z.string().min(1, 'El modelo es requerido'),
  numero_serie: z.string().optional(),
  capacidad_btu: z.number({ coerce: true }).optional(),
  tipo_ac: z.string().optional(),
  fecha_instalacion: z.string().optional(),
  fecha_ultimo_mantenimiento: z.string().optional(),
  frecuencia_mantenimiento: z.string().optional(),
  ubicacion_nombre: z.string().optional(),
  ubicacion_direccion: z.string().optional(),
  ubicacion_municipio: z.string().optional(),
  ubicacion_parroquia: z.string().optional(),
  estado: z.string().default('Operativo'),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddAcUnitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  onSuccess: () => void
  editItem?: StockAcUnit
}

export function AddAcUnitDialog({ open, onOpenChange, locations, onSuccess, editItem }: AddAcUnitDialogProps) {
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
          numero_serie: editItem.numero_serie || '',
          capacidad_btu: editItem.capacidad_btu,
          tipo_ac: editItem.tipo_ac || '',
          fecha_instalacion: editItem.fecha_instalacion || '',
          fecha_ultimo_mantenimiento: editItem.fecha_ultimo_mantenimiento || '',
          frecuencia_mantenimiento: editItem.frecuencia_mantenimiento || '',
          ubicacion_nombre: editItem.ubicacion_nombre || '',
          ubicacion_direccion: editItem.ubicacion_direccion || '',
          ubicacion_municipio: editItem.ubicacion_municipio || '',
          ubicacion_parroquia: editItem.ubicacion_parroquia || '',
          estado: editItem.estado,
          notas: editItem.notas || '',
        }
      : { estado: 'Operativo' },
  })

  const watchedValues = {
    tipo_ac: watch('tipo_ac'),
    frecuencia_mantenimiento: watch('frecuencia_mantenimiento'),
    estado: watch('estado'),
    location_id: watch('location_id'),
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = [...pendingFiles, ...files].slice(0, 10)
    setPendingFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
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
      let unit: StockAcUnit
      if (isEditing) {
        unit = await stockItemService.updateAcUnit(editItem!.id, data)
      } else {
        unit = await stockItemService.createAcUnit(data)
      }
      if (pendingFiles.length > 0) {
        await stockItemService.uploadPhotos('ac_unit', unit.id, pendingFiles)
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
          <DialogTitle>{isEditing ? 'Editar Aire Acondicionado' : 'Agregar Aire Acondicionado'}</DialogTitle>
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
            <Select
              value={watchedValues.location_id?.toString() || ''}
              onValueChange={(v) => setValue('location_id', parseInt(v))}
            >
              <SelectTrigger className={errors.location_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar institución" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id.toString()}>{l.nombre_institucion}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location_id && <p className="text-xs text-red-500">{errors.location_id.message}</p>}
          </div>

          {/* Marca, Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca <span className="text-red-500">*</span></Label>
              <Input {...register('marca')} placeholder="LG" className={errors.marca ? 'border-red-500' : ''} />
              {errors.marca && <p className="text-xs text-red-500">{errors.marca.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Modelo <span className="text-red-500">*</span></Label>
              <Input {...register('modelo')} placeholder="Inverter 12000" className={errors.modelo ? 'border-red-500' : ''} />
              {errors.modelo && <p className="text-xs text-red-500">{errors.modelo.message}</p>}
            </div>
          </div>

          {/* Serie, BTU, Tipo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Número de Serie</Label>
              <Input {...register('numero_serie')} placeholder="SN-12345" />
            </div>
            <div className="space-y-2">
              <Label>Capacidad (BTU)</Label>
              <Input {...register('capacidad_btu')} type="number" placeholder="12000" />
            </div>
            <div className="space-y-2">
              <Label>Tipo de A/C</Label>
              <Select value={watchedValues.tipo_ac || ''} onValueChange={(v) => setValue('tipo_ac', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                <SelectContent>
                  {['Split','Central','Ventana','Portátil','Mini Split','Otro'].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instalación, Último Mantenimiento, Frecuencia */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Instalación</Label>
              <Input {...register('fecha_instalacion')} type="date" />
            </div>
            <div className="space-y-2">
              <Label>Último Mantenimiento</Label>
              <Input {...register('fecha_ultimo_mantenimiento')} type="date" />
            </div>
            <div className="space-y-2">
              <Label>Frecuencia de Mantenimiento</Label>
              <Select value={watchedValues.frecuencia_mantenimiento || ''} onValueChange={(v) => setValue('frecuencia_mantenimiento', v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
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
            <p className="text-sm font-medium text-slate-700 mb-3">Ubicación del Equipo</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre de Ubicación</Label>
                <Input {...register('ubicacion_nombre')} placeholder="Oficina principal" />
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
            <Select value={watchedValues.estado || 'Operativo'} onValueChange={(v) => setValue('estado', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Operativo','En reparación','Fuera de servicio','Dado de baja'].map((e) => (
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
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic" className="hidden" onChange={handleFileChange} />
            {previews.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-full h-20 object-cover rounded-lg border" />
                    <button type="button" onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {pendingFiles.length === 0 && !isEditing && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ImageIcon className="h-3.5 w-3.5" />
                <span>Puedes agregar fotos después de crear el equipo</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Agregar A/C'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
