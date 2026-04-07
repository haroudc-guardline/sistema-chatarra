'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Plus, Check, X } from 'lucide-react'
import { usePartTypes, usePartTypeMutations } from '@/hooks/useParts'
import { partsService } from '@/lib/services/parts-service'
import type { PartCategory, Location, StockPart } from '@/types/database'

const ESTADO_OPTIONS = ['Disponible', 'En uso', 'Dañada', 'Dado de baja'] as const

const schema = z.object({
  part_type_id: z.number().min(1, 'El tipo de pieza es requerido'),
  location_id: z.number().min(1, 'La institución es requerida'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  cantidad: z.number().min(1, 'La cantidad mínima es 1'),
  estado: z.string().min(1, 'El estado es requerido'),
  responsable_nombre: z.string().optional(),
  responsable_telefono: z.string().optional(),
  responsable_email: z.string().email('Email inválido').optional().or(z.literal('')),
  ubicacion_nombre: z.string().optional(),
  ubicacion_direccion: z.string().optional(),
  ubicacion_municipio: z.string().optional(),
  codigo_marbete: z.string().optional(),
  notas: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface AddPartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: PartCategory
  locations: Location[]
  onSuccess: () => void
  editItem?: StockPart
}

export function AddPartDialog({
  open,
  onOpenChange,
  category,
  locations,
  onSuccess,
  editItem,
}: AddPartDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingNewType, setAddingNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [creatingType, setCreatingType] = useState(false)

  const { partTypes, refetch: refetchPartTypes } = usePartTypes(category)
  const { create: createPartType } = usePartTypeMutations()
  const isEditing = !!editItem

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editItem
      ? {
          part_type_id: editItem.part_type_id,
          location_id: editItem.location_id,
          marca: editItem.marca || '',
          modelo: editItem.modelo || '',
          cantidad: editItem.cantidad,
          estado: editItem.estado,
          responsable_nombre: editItem.responsable_nombre || '',
          responsable_telefono: editItem.responsable_telefono || '',
          responsable_email: editItem.responsable_email || '',
          ubicacion_nombre: editItem.ubicacion_nombre || '',
          ubicacion_direccion: editItem.ubicacion_direccion || '',
          ubicacion_municipio: editItem.ubicacion_municipio || '',
          codigo_marbete: editItem.codigo_marbete || '',
          notas: editItem.notas || '',
        }
      : {
          cantidad: 1,
          estado: 'Disponible',
        },
  })

  // Reset form when editItem changes
  useEffect(() => {
    if (open) {
      if (editItem) {
        reset({
          part_type_id: editItem.part_type_id,
          location_id: editItem.location_id,
          marca: editItem.marca || '',
          modelo: editItem.modelo || '',
          cantidad: editItem.cantidad,
          estado: editItem.estado,
          responsable_nombre: editItem.responsable_nombre || '',
          responsable_telefono: editItem.responsable_telefono || '',
          responsable_email: editItem.responsable_email || '',
          ubicacion_nombre: editItem.ubicacion_nombre || '',
          ubicacion_direccion: editItem.ubicacion_direccion || '',
          ubicacion_municipio: editItem.ubicacion_municipio || '',
          codigo_marbete: editItem.codigo_marbete || '',
          notas: editItem.notas || '',
        })
      } else {
        reset({ cantidad: 1, estado: 'Disponible' })
      }
      setError(null)
      setAddingNewType(false)
      setNewTypeName('')
    }
  }, [open, editItem, reset])

  const watchedValues = {
    part_type_id: watch('part_type_id'),
    estado: watch('estado'),
    location_id: watch('location_id'),
  }

  const handleAddNewType = async () => {
    const trimmed = newTypeName.trim()
    if (!trimmed) return
    setCreatingType(true)
    try {
      const created = await createPartType.mutateAsync({ category, nombre: trimmed })
      await refetchPartTypes()
      setValue('part_type_id', created.id)
      setAddingNewType(false)
      setNewTypeName('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear tipo de pieza')
    } finally {
      setCreatingType(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    setError(null)
    try {
      if (isEditing) {
        await partsService.updatePart(category, editItem!.id, data)
      } else {
        await partsService.createPart(category, data)
      }
      reset()
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Pieza' : 'Agregar Pieza'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Tipo de Pieza */}
          <div className="space-y-2">
            <Label>Tipo de Pieza <span className="text-red-500">*</span></Label>
            {addingNewType ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Nombre del nuevo tipo..."
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleAddNewType() }
                    if (e.key === 'Escape') { setAddingNewType(false); setNewTypeName('') }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-emerald-600 hover:bg-emerald-50"
                  disabled={creatingType || !newTypeName.trim()}
                  onClick={handleAddNewType}
                >
                  {creatingType ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-slate-500 hover:bg-slate-50"
                  onClick={() => { setAddingNewType(false); setNewTypeName('') }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Select
                value={watchedValues.part_type_id?.toString() || ''}
                onValueChange={(v) => {
                  if (v === '__new__') {
                    setAddingNewType(true)
                  } else {
                    setValue('part_type_id', parseInt(v))
                  }
                }}
              >
                <SelectTrigger className={errors.part_type_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Seleccionar tipo de pieza" />
                </SelectTrigger>
                <SelectContent>
                  {partTypes.map((pt) => (
                    <SelectItem key={pt.id} value={pt.id.toString()}>{pt.nombre}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-blue-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" />
                      Agregar nuevo tipo
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
            {errors.part_type_id && <p className="text-xs text-red-500">{errors.part_type_id.message}</p>}
          </div>

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

          {/* Marca / Modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input {...register('marca')} placeholder="Ej: Toyota, Samsung..." />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input {...register('modelo')} placeholder="Ej: Corolla, AR12..." />
            </div>
          </div>

          {/* Cantidad + Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cantidad <span className="text-red-500">*</span></Label>
              <Input
                {...register('cantidad', { valueAsNumber: true })}
                type="number"
                min={1}
                className={errors.cantidad ? 'border-red-500' : ''}
              />
              {errors.cantidad && <p className="text-xs text-red-500">{errors.cantidad.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Estado <span className="text-red-500">*</span></Label>
              <Select
                value={watchedValues.estado || 'Disponible'}
                onValueChange={(v) => setValue('estado', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ESTADO_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsable */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Responsable</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input {...register('responsable_nombre')} placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input {...register('responsable_telefono')} placeholder="+507 6000-0000" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input {...register('responsable_email')} placeholder="correo@ejemplo.com" type="email" />
                {errors.responsable_email && (
                  <p className="text-xs text-red-500">{errors.responsable_email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Ubicación</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
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
            </div>
          </div>

          {/* Código de Marbete */}
          <div className="space-y-2">
            <Label>Código de Marbete</Label>
            <Input {...register('codigo_marbete')} placeholder="Ej: MRB-2026-001" />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea {...register('notas')} placeholder="Observaciones adicionales..." rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Agregar Pieza'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
