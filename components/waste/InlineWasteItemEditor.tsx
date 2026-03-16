'use client'

import { useState, useRef } from 'react'
import { CreatableSubcategorySelect } from '@/components/waste/CreatableSubcategorySelect'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Plus, Trash2, Package, Weight, DollarSign, Star, AlertCircle, X, ImageIcon } from 'lucide-react'
import type { WasteType } from '@/types/database'

export interface PendingWasteItem {
  waste_type_id: number
  subcategoria?: string | null
  volume: number
  weight: number
  value: number
  quality?: string | null
  pendingPhotos: File[]
  waste_type_name?: string
}

interface InlineWasteItemEditorProps {
  wasteTypes: WasteType[]
  items: PendingWasteItem[]
  onChange: (items: PendingWasteItem[]) => void
  existingItems?: Array<{
    id: number
    waste_type_name: string
    subcategoria?: string | null
    volume: number
    weight: number
    value: number
    quality?: string | null
  }>
}

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

export function InlineWasteItemEditor({ wasteTypes, items, onChange, existingItems = [] }: InlineWasteItemEditorProps) {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newItem, setNewItem] = useState({
    waste_type_id: '',
    subcategoria: '',
    volume: '',
    weight: '',
    value: '',
    quality: '',
  })

  // Totals from both existing + pending items
  const allItems = [
    ...existingItems.map(ei => ({ volume: ei.volume, weight: ei.weight, value: ei.value })),
    ...items.map(i => ({ volume: i.volume, weight: i.weight, value: i.value })),
  ]
  const totalVolume = allItems.reduce((sum, item) => sum + (item.volume || 0), 0)
  const totalWeight = allItems.reduce((sum, item) => sum + (item.weight || 0), 0)
  const totalValue = allItems.reduce((sum, item) => sum + (item.value || 0), 0)
  const totalItemCount = existingItems.length + items.length

  const handleWeightChange = (weightStr: string) => {
    const w = parseFloat(weightStr) || 0
    const calculatedValue = calculateValue(w)
    setNewItem({
      ...newItem,
      weight: weightStr,
      value: w > 0 ? calculatedValue.toFixed(2) : '',
    })
  }

  const handleAddItem = () => {
    setError(null)

    if (!newItem.waste_type_id) {
      setError('Debes seleccionar un tipo de residuo')
      return
    }
    if (!newItem.volume || parseFloat(newItem.volume) <= 0) {
      setError('El volumen debe ser mayor a 0')
      return
    }
    if (!newItem.weight || parseFloat(newItem.weight) <= 0) {
      setError('El peso debe ser mayor a 0')
      return
    }

    const selectedType = wasteTypes.find(wt => wt.id === parseInt(newItem.waste_type_id))

    const item: PendingWasteItem = {
      waste_type_id: parseInt(newItem.waste_type_id),
      subcategoria: newItem.subcategoria || null,
      volume: parseFloat(newItem.volume),
      weight: parseFloat(newItem.weight),
      value: parseFloat(newItem.value) || calculateValue(parseFloat(newItem.weight)),
      quality: newItem.quality || null,
      pendingPhotos: [...pendingFiles],
      waste_type_name: selectedType?.nombre || 'Sin tipo',
    }

    onChange([...items, item])
    setShowAddDialog(false)
    setNewItem({ waste_type_id: '', subcategoria: '', volume: '', weight: '', value: '', quality: '' })
    setPendingFiles([])
    setError(null)
  }

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/'))
    setPendingFiles(prev => [...prev, ...validFiles].slice(0, 10))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getQualityBadge = (quality?: string | null) => {
    if (!quality) return null
    const option = QUALITY_OPTIONS.find(opt => opt.value === quality)
    return option ? option.color : 'bg-slate-100 text-slate-800'
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 p-3 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-lg border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
            <Package className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Volumen</p>
            <p className="text-sm font-semibold text-slate-900">{totalVolume.toFixed(2)} m³</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Weight className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Peso</p>
            <p className="text-sm font-semibold text-slate-900">{totalWeight.toFixed(2)} kg</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Valor</p>
            <p className="text-sm font-semibold text-slate-900">${totalValue.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Existing items (read-only, from DB) */}
      {existingItems.map((item) => (
        <div
          key={`existing-${item.id}`}
          className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50/50"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5">
              {item.waste_type_name}
            </Badge>
            {item.subcategoria && (
              <Badge variant="outline" className="text-slate-600 text-xs px-2 py-0.5">
                {item.subcategoria}
              </Badge>
            )}
            <span className="text-xs text-slate-500">{item.volume}m³</span>
            <span className="text-xs text-slate-500">{item.weight}kg</span>
            <span className="text-xs text-slate-500">${item.value}</span>
            {item.quality && (
              <Badge className={`text-[10px] ${getQualityBadge(item.quality)}`}>{item.quality}</Badge>
            )}
          </div>
          <Badge variant="outline" className="text-[10px] text-slate-400">Guardado</Badge>
        </div>
      ))}

      {/* Pending items (new, local) */}
      {items.map((item, index) => (
        <div
          key={`pending-${index}`}
          className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50/30"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5">
              {item.waste_type_name || 'Sin tipo'}
            </Badge>
            {item.subcategoria && (
              <Badge variant="outline" className="text-slate-600 text-xs px-2 py-0.5">
                {item.subcategoria}
              </Badge>
            )}
            <span className="text-xs text-slate-500">{item.volume}m³</span>
            <span className="text-xs text-slate-500">{item.weight}kg</span>
            <span className="text-xs text-slate-500">${item.value}</span>
            {item.quality && (
              <Badge className={`text-[10px] ${getQualityBadge(item.quality)}`}>{item.quality}</Badge>
            )}
            {item.pendingPhotos.length > 0 && (
              <span className="text-[10px] text-slate-400">{item.pendingPhotos.length} foto(s)</span>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveItem(index)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}

      {/* Empty state */}
      {totalItemCount === 0 && (
        <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No hay items de residuos</p>
          <p className="text-xs text-slate-400 mt-1">Agrega items para registrar el detalle</p>
        </div>
      )}

      {/* Add button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setShowAddDialog(true)}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar Item de Residuo
      </Button>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) {
          setPendingFiles([])
          setError(null)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Item de Residuo</DialogTitle>
            <DialogDescription>
              Ingresa los detalles del nuevo item de residuo.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4 py-4">
            {/* Waste Type */}
            <div className="space-y-2">
              <Label htmlFor="inline-waste-type">Tipo de Residuo *</Label>
              <Select
                value={newItem.waste_type_id}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, waste_type_id: value, subcategoria: '' })
                }
              >
                <SelectTrigger id="inline-waste-type">
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
                wasteTypeId={newItem.waste_type_id ? parseInt(newItem.waste_type_id) : null}
                value={newItem.subcategoria}
                onChange={(v) => setNewItem({ ...newItem, subcategoria: v })}
              />
            </div>

            {/* Volume and Weight */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inline-volume">Volumen (m³) *</Label>
                <Input
                  id="inline-volume"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.volume}
                  onChange={(e) => setNewItem({ ...newItem, volume: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inline-weight">Peso (kg) *</Label>
                <Input
                  id="inline-weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newItem.weight}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Value (auto-calculated) and Quality */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inline-value">Valor ($)</Label>
                <Input
                  id="inline-value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newItem.value}
                  disabled
                  className="bg-slate-50"
                  placeholder="0.00"
                />
                <p className="text-xs text-slate-400">Auto-calculado: peso/1,000 × $100/ton</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inline-quality">Calidad</Label>
                <Select
                  value={newItem.quality || "no-calidad"}
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, quality: value === "no-calidad" ? "" : value })
                  }
                >
                  <SelectTrigger id="inline-quality">
                    <SelectValue placeholder="Selecciona calidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-calidad">Sin especificar (opcional)</SelectItem>
                    {QUALITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${option.color.replace('bg-', 'bg-').replace('text-', '')}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="space-y-2">
              <Label>Fotos del Item</Label>
              <div
                className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Haz clic para agregar fotos</p>
                <p className="text-xs text-slate-400">Max 10 fotos, 5MB cada una (JPG, PNG, WebP)</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />

              {pendingFiles.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {pendingFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-20 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => {
              setShowAddDialog(false)
              setError(null)
              setPendingFiles([])
            }}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAddItem}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Agregar Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
