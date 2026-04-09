'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Loader2, Plus, Trash2, Check, X, ChevronRight, ChevronLeft,
  Tag, Package, Search,
} from 'lucide-react'
import { usePartTypes, usePartTypeMutations } from '@/hooks/useParts'
import { useMarbeteSearch, useMarbeteMutations } from '@/hooks/useMarbetes'
import { InstitutionSelect } from './InstitutionSelect'
import type { PartCategory, Location, Marbete } from '@/types/database'

const ESTADO_OPTIONS = ['Disponible', 'En uso', 'Dañada', 'Dado de baja'] as const

// Schema for a single part row
const partRowSchema = z.object({
  part_type_id: z.number().min(1, 'Requerido'),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  cantidad: z.number().min(1, 'Min. 1'),
  estado: z.string().min(1, 'Requerido'),
  notas: z.string().optional(),
})

// Schema for the marbete (shared info) - step 1
const marbeteSchema = z.object({
  codigo: z.string().min(1, 'El código de marbete es requerido'),
  location_id: z.number().min(1, 'La institución es requerida'),
  responsable_nombre: z.string().optional(),
  responsable_telefono: z.string().optional(),
  responsable_email: z.string().email('Email inválido').optional().or(z.literal('')),
  ubicacion_nombre: z.string().optional(),
  ubicacion_direccion: z.string().optional(),
  ubicacion_municipio: z.string().optional(),
  notas: z.string().optional(),
})

// Combined schema for the full form
const fullSchema = marbeteSchema.extend({
  parts: z.array(partRowSchema).min(1, 'Debe agregar al menos una pieza'),
})

type MarbeteFormData = z.infer<typeof marbeteSchema>
type FullFormData = z.infer<typeof fullSchema>

interface AddMarbeteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: PartCategory
  locations: Location[]
  onSuccess: () => void
  /** If provided, skip step 1 and go directly to adding parts */
  existingMarbete?: Marbete
}

export function AddMarbeteDialog({
  open,
  onOpenChange,
  category,
  locations,
  onSuccess,
  existingMarbete,
}: AddMarbeteDialogProps) {
  const [step, setStep] = useState<1 | 2>(existingMarbete ? 2 : 1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMarbete, setSelectedMarbete] = useState<Marbete | null>(existingMarbete ?? null)
  const [marbeteMode, setMarbeteMode] = useState<'new' | 'existing'>('new')
  const [marbeteSearch, setMarbeteSearch] = useState('')
  const [addingNewType, setAddingNewType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [creatingType, setCreatingType] = useState(false)

  const { partTypes, refetch: refetchPartTypes } = usePartTypes(category)
  const { create: createPartType } = usePartTypeMutations()
  const { marbetes: searchResults } = useMarbeteSearch(category, {
    search: marbeteSearch || undefined,
    limit: 10,
  })
  const { create: createMarbete, addParts } = useMarbeteMutations(category)

  // Step 1 form: marbete info
  const marbeteForm = useForm<MarbeteFormData>({
    resolver: zodResolver(marbeteSchema),
    defaultValues: {
      codigo: '',
      responsable_nombre: '',
      responsable_telefono: '',
      responsable_email: '',
      ubicacion_nombre: '',
      ubicacion_direccion: '',
      ubicacion_municipio: '',
      notas: '',
    },
  })

  // Step 2 form: parts list
  const partsForm = useForm<{ parts: z.infer<typeof partRowSchema>[] }>({
    defaultValues: {
      parts: [{ part_type_id: 0, marca: '', modelo: '', cantidad: 1, estado: 'Disponible', notas: '' }],
    },
  })

  const { fields, append, remove: removeField } = useFieldArray({
    control: partsForm.control,
    name: 'parts',
  })

  // Reset all state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setError(null)
      if (existingMarbete) {
        setStep(2)
        setSelectedMarbete(existingMarbete)
        setMarbeteMode('existing')
      } else {
        setStep(1)
        setSelectedMarbete(null)
        setMarbeteMode('new')
        marbeteForm.reset()
      }
      partsForm.reset({
        parts: [{ part_type_id: 0, marca: '', modelo: '', cantidad: 1, estado: 'Disponible', notas: '' }],
      })
      setMarbeteSearch('')
      setAddingNewType(false)
      setNewTypeName('')
    }
  }, [open, existingMarbete, marbeteForm, partsForm])

  const handleSelectExistingMarbete = useCallback((marbete: Marbete) => {
    setSelectedMarbete(marbete)
    setMarbeteMode('existing')
  }, [])

  const handleAddNewType = async () => {
    const trimmed = newTypeName.trim()
    if (!trimmed) return
    setCreatingType(true)
    try {
      await createPartType.mutateAsync({ category, nombre: trimmed })
      await refetchPartTypes()
      setAddingNewType(false)
      setNewTypeName('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear tipo de pieza')
    } finally {
      setCreatingType(false)
    }
  }

  // Proceed from step 1 to step 2
  const handleNextStep = async () => {
    if (marbeteMode === 'existing' && selectedMarbete) {
      setStep(2)
      setError(null)
      return
    }

    // Validate marbete form for new marbete
    const valid = await marbeteForm.trigger()
    if (!valid) return
    setStep(2)
    setError(null)
  }

  // Submit: create marbete (if new) + create parts
  const handleSubmit = async () => {
    // Validate parts
    const partsValid = await partsForm.trigger()
    if (!partsValid) return

    const partsData = partsForm.getValues('parts')
    if (partsData.length === 0 || partsData.some((p) => !p.part_type_id)) {
      setError('Complete todos los tipos de pieza antes de guardar')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (marbeteMode === 'existing' && selectedMarbete) {
        // Add parts to existing marbete
        await addParts.mutateAsync({
          marbeteId: selectedMarbete.id,
          parts: partsData,
        })
      } else {
        // Create new marbete + parts
        const marbeteData = marbeteForm.getValues()
        await createMarbete.mutateAsync({
          ...marbeteData,
          category,
          parts: partsData,
        })
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const watchedLocation = marbeteForm.watch('location_id')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 ? (
              <>
                <Tag className="h-5 w-5 text-blue-600" />
                Paso 1: Información del Marbete
              </>
            ) : (
              <>
                <Package className="h-5 w-5 text-blue-600" />
                Paso 2: Agregar Piezas
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            step === 1 ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <Check className={`h-3 w-3 ${step === 1 ? 'opacity-0' : ''}`} />
            Marbete
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
            step === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
          }`}>
            Piezas
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* ─── STEP 1: Marbete info ─── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Toggle: New vs Existing */}
            {!existingMarbete && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={marbeteMode === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { setMarbeteMode('new'); setSelectedMarbete(null) }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Nuevo Marbete
                </Button>
                <Button
                  type="button"
                  variant={marbeteMode === 'existing' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMarbeteMode('existing')}
                >
                  <Search className="h-3.5 w-3.5 mr-1.5" />
                  Marbete Existente
                </Button>
              </div>
            )}

            {marbeteMode === 'existing' && !existingMarbete && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Buscar por código de marbete..."
                    value={marbeteSearch}
                    onChange={(e) => setMarbeteSearch(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((m) => (
                      <Card
                        key={m.id}
                        className={`cursor-pointer transition-colors hover:bg-slate-50 ${
                          selectedMarbete?.id === m.id ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''
                        }`}
                        onClick={() => handleSelectExistingMarbete(m)}
                      >
                        <CardContent className="p-3 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{m.codigo}</p>
                            <p className="text-xs text-slate-500">
                              {m.location?.nombre_institucion || '—'}
                              {m.responsable_nombre && ` · ${m.responsable_nombre}`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {m.parts_count ?? 0} pieza{(m.parts_count ?? 0) !== 1 ? 's' : ''}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : marbeteSearch ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    No se encontraron marbetes con &quot;{marbeteSearch}&quot;
                  </p>
                ) : null}
              </div>
            )}

            {marbeteMode === 'new' && (
              <div className="space-y-5">
                {/* Código de Marbete */}
                <div className="space-y-2">
                  <Label>Código de Marbete <span className="text-red-500">*</span></Label>
                  <Input
                    {...marbeteForm.register('codigo')}
                    placeholder="Ej: MRB-2026-001"
                    className={marbeteForm.formState.errors.codigo ? 'border-red-500' : ''}
                    autoFocus
                  />
                  {marbeteForm.formState.errors.codigo && (
                    <p className="text-xs text-red-500">{marbeteForm.formState.errors.codigo.message}</p>
                  )}
                </div>

                {/* Institución */}
                <div className="space-y-2">
                  <Label>Institución <span className="text-red-500">*</span></Label>
                  <InstitutionSelect
                    value={watchedLocation}
                    onChange={(id) => marbeteForm.setValue('location_id', id)}
                    error={!!marbeteForm.formState.errors.location_id}
                    locations={locations}
                  />
                  {marbeteForm.formState.errors.location_id && (
                    <p className="text-xs text-red-500">{marbeteForm.formState.errors.location_id.message}</p>
                  )}
                </div>

                {/* Responsable */}
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-3">Responsable</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Nombre</Label>
                      <Input {...marbeteForm.register('responsable_nombre')} placeholder="Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono</Label>
                      <Input {...marbeteForm.register('responsable_telefono')} placeholder="+507 6000-0000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input {...marbeteForm.register('responsable_email')} placeholder="correo@ejemplo.com" type="email" />
                      {marbeteForm.formState.errors.responsable_email && (
                        <p className="text-xs text-red-500">{marbeteForm.formState.errors.responsable_email.message}</p>
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
                      <Input {...marbeteForm.register('ubicacion_nombre')} placeholder="Depósito Central" />
                    </div>
                    <div className="space-y-2">
                      <Label>Dirección</Label>
                      <Input {...marbeteForm.register('ubicacion_direccion')} placeholder="Av. Principal, #123" />
                    </div>
                    <div className="space-y-2">
                      <Label>Municipio</Label>
                      <Input {...marbeteForm.register('ubicacion_municipio')} placeholder="Panamá" />
                    </div>
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea {...marbeteForm.register('notas')} placeholder="Observaciones del marbete..." rows={2} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: Parts list ─── */}
        {step === 2 && (
          <div className="space-y-4">
            {/* Marbete summary */}
            <Card className="bg-slate-50/80 border-slate-200">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-800">
                      {selectedMarbete ? selectedMarbete.codigo : marbeteForm.getValues('codigo')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {selectedMarbete
                      ? selectedMarbete.location?.nombre_institucion
                      : locations.find((l) => l.id === marbeteForm.getValues('location_id'))?.nombre_institucion
                    }
                  </span>
                </div>
                {selectedMarbete?.responsable_nombre && (
                  <p className="text-xs text-slate-500 mt-1">
                    Responsable: {selectedMarbete.responsable_nombre}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Parts list header */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                Piezas ({fields.length})
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => append({ part_type_id: 0, marca: '', modelo: '', cantidad: 1, estado: 'Disponible', notas: '' })}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Agregar Pieza
              </Button>
            </div>

            {/* New Part Type inline creator */}
            {addingNewType && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <Input
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="Nombre del nuevo tipo de pieza..."
                  className="flex-1 bg-white"
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
            )}

            {/* Part rows */}
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-slate-200">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Pieza {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeField(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    {/* Row 1: Tipo + Cantidad + Estado */}
                    <div className="grid grid-cols-6 gap-3">
                      <div className="col-span-3 space-y-1">
                        <Label className="text-xs">Tipo de Pieza <span className="text-red-500">*</span></Label>
                        <Select
                          value={partsForm.watch(`parts.${index}.part_type_id`)?.toString() || ''}
                          onValueChange={(v) => {
                            if (v === '__new__') {
                              setAddingNewType(true)
                            } else {
                              partsForm.setValue(`parts.${index}.part_type_id`, parseInt(v))
                            }
                          }}
                        >
                          <SelectTrigger className={
                            partsForm.formState.errors.parts?.[index]?.part_type_id ? 'border-red-500' : ''
                          }>
                            <SelectValue placeholder="Seleccionar tipo" />
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
                      </div>
                      <div className="col-span-1 space-y-1">
                        <Label className="text-xs">Cantidad <span className="text-red-500">*</span></Label>
                        <Input
                          {...partsForm.register(`parts.${index}.cantidad`, { valueAsNumber: true })}
                          type="number"
                          min={1}
                          className={partsForm.formState.errors.parts?.[index]?.cantidad ? 'border-red-500' : ''}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Estado <span className="text-red-500">*</span></Label>
                        <Select
                          value={partsForm.watch(`parts.${index}.estado`) || 'Disponible'}
                          onValueChange={(v) => partsForm.setValue(`parts.${index}.estado`, v)}
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

                    {/* Row 2: Marca + Modelo */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input {...partsForm.register(`parts.${index}.marca`)} placeholder="Ej: Toyota, Samsung..." />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Modelo</Label>
                        <Input {...partsForm.register(`parts.${index}.modelo`)} placeholder="Ej: Corolla, AR12..." />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick add button at bottom */}
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-slate-300 text-slate-500 hover:text-slate-700 hover:border-slate-400"
              onClick={() => append({ part_type_id: 0, marca: '', modelo: '', cantidad: 1, estado: 'Disponible', notas: '' })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar otra pieza
            </Button>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 pt-4 border-t border-slate-100">
          {step === 2 && !existingMarbete && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setStep(1); setError(null) }}
              className="mr-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Volver
            </Button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>

            {step === 1 && (
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={marbeteMode === 'existing' && !selectedMarbete}
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}

            {step === 2 && (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {selectedMarbete ? `Agregar ${fields.length} Pieza${fields.length > 1 ? 's' : ''}` : 'Crear Marbete y Piezas'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
