'use client'

import { useMemo, useState } from 'react'
import { CreatableSubcategorySelect } from '@/components/waste/CreatableSubcategorySelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { Location, WasteType } from '@/types/database'

const QUALITY_OPTIONS = [
  { value: 'Excelente', label: 'Excelente', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'Buena', label: 'Buena', color: 'bg-blue-100 text-blue-800' },
  { value: 'Regular', label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Baja', label: 'Baja', color: 'bg-orange-100 text-orange-800' },
  { value: 'Deficiente', label: 'Deficiente', color: 'bg-red-100 text-red-800' },
]

function calculateValue(weightKg: number): number {
  return (weightKg / 1000) * 100
}

const EMPTY_FORM = {
  location_id: '',
  waste_type_id: '',
  subcategoria: '',
  volume: '',
  weight: '',
  value: '',
  quality: '',
}

interface AddWasteItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  locations: Location[]
  wasteTypes: WasteType[]
  onCreated?: () => void
}

export function AddWasteItemDialog({
  open,
  onOpenChange,
  locations,
  wasteTypes,
  onCreated,
}: AddWasteItemDialogProps) {
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const sortedLocations = useMemo(
    () =>
      [...locations].sort((a, b) =>
        (a.nombre_institucion || '').localeCompare(b.nombre_institucion || '')
      ),
    [locations]
  )

  const handleWeightChange = (weightStr: string) => {
    const w = parseFloat(weightStr) || 0
    setForm((prev) => ({
      ...prev,
      weight: weightStr,
      value: w > 0 ? calculateValue(w).toFixed(2) : '',
    }))
  }

  const handleClose = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      setForm(EMPTY_FORM)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    setError(null)

    if (!form.location_id) {
      setError('Debes seleccionar una ubicación')
      return
    }
    if (!form.waste_type_id) {
      setError('Debes seleccionar un tipo de residuo')
      return
    }
    if (!form.volume || parseFloat(form.volume) <= 0) {
      setError('El volumen debe ser mayor a 0')
      return
    }
    if (!form.weight || parseFloat(form.weight) <= 0) {
      setError('El peso debe ser mayor a 0')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch(`/api/locations/${form.location_id}/waste-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waste_type_id: parseInt(form.waste_type_id),
          subcategoria: form.subcategoria || null,
          volume: parseFloat(form.volume),
          weight: parseFloat(form.weight),
          value: parseFloat(form.value) || calculateValue(parseFloat(form.weight)),
          quality: form.quality || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al crear el item. Verifica que tienes permisos.')
      }

      setForm(EMPTY_FORM)
      onOpenChange(false)
      onCreated?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al crear el item.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Item de Residuo</DialogTitle>
          <DialogDescription>
            Selecciona la ubicación e ingresa los detalles del nuevo item de residuo.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Ubicación *</Label>
            <Select
              value={form.location_id}
              onValueChange={(value) => setForm({ ...form, location_id: value })}
            >
              <SelectTrigger id="location">
                <SelectValue placeholder="Selecciona una ubicación" />
              </SelectTrigger>
              <SelectContent>
                {sortedLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    <div className="flex flex-col">
                      <span>{loc.nombre_institucion}</span>
                      <span className="text-xs text-slate-500">
                        {[loc.ciudad, loc.municipio].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Waste Type */}
          <div className="space-y-2">
            <Label htmlFor="add-waste-type">Tipo de Residuo *</Label>
            <Select
              value={form.waste_type_id}
              onValueChange={(value) =>
                setForm({ ...form, waste_type_id: value, subcategoria: '' })
              }
            >
              <SelectTrigger id="add-waste-type">
                <SelectValue placeholder="Selecciona un tipo de residuo" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    <div className="flex flex-col">
                      <span>{type.nombre}</span>
                      <span className="text-xs text-slate-500">{type.categoria}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoria */}
          <div className="space-y-2">
            <Label>Subcategoría</Label>
            <CreatableSubcategorySelect
              wasteTypeId={form.waste_type_id ? parseInt(form.waste_type_id) : null}
              value={form.subcategoria}
              onChange={(v) => setForm((prev) => ({ ...prev, subcategoria: v }))}
            />
          </div>

          {/* Volume and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-volume">Volumen (m³) *</Label>
              <Input
                id="add-volume"
                type="number"
                step="0.01"
                min="0.01"
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-weight">Peso (kg) *</Label>
              <Input
                id="add-weight"
                type="number"
                step="0.01"
                min="0.01"
                value={form.weight}
                onChange={(e) => handleWeightChange(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Value (auto-calculated) and Quality */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="add-value">Valor ($)</Label>
              <Input
                id="add-value"
                type="number"
                step="0.01"
                min="0"
                value={form.value}
                disabled
                className="bg-slate-50"
                placeholder="0.00"
              />
              <p className="text-xs text-slate-400">Auto-calculado: peso/1,000 × $100/ton</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-quality">Calidad</Label>
              <Select
                value={form.quality || 'no-calidad'}
                onValueChange={(value) =>
                  setForm({ ...form, quality: value === 'no-calidad' ? '' : value })
                }
              >
                <SelectTrigger id="add-quality">
                  <SelectValue placeholder="Selecciona calidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-calidad">Sin especificar (opcional)</SelectItem>
                  {QUALITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Para agregar fotos al item, abre la ubicación tras crearlo.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              'Agregar Item'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
