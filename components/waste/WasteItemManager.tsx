'use client'

import { useState, useEffect } from 'react'
import { useWasteItems } from '@/hooks/useWasteItems'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Trash2, Package, Weight, DollarSign, Star, AlertCircle, Loader2 } from 'lucide-react'
import type { WasteType } from '@/types/database'

interface WasteItemManagerProps {
  locationId: number
  wasteTypes: WasteType[]
}

// Quality options for dropdown
const QUALITY_OPTIONS = [
  { value: 'Excelente', label: 'Excelente', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'Buena', label: 'Buena', color: 'bg-blue-100 text-blue-800' },
  { value: 'Regular', label: 'Regular', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'Baja', label: 'Baja', color: 'bg-orange-100 text-orange-800' },
  { value: 'Deficiente', label: 'Deficiente', color: 'bg-red-100 text-red-800' },
]

export function WasteItemManager({ locationId, wasteTypes }: WasteItemManagerProps) {
  const { user } = useAuth()
  const {
    wasteItems,
    isLoading,
    isCreating,
    fetchWasteItems,
    createWasteItem,
    deleteWasteItem,
  } = useWasteItems(locationId)

  // Helper: resolve waste type name from join OR from local wasteTypes list as fallback
  const getWasteTypeName = (item: { waste_type?: { nombre?: string } | null; waste_type_id?: number }): string => {
    if (item.waste_type?.nombre) return item.waste_type.nombre
    if (item.waste_type_id) {
      const found = wasteTypes.find(wt => wt.id === item.waste_type_id)
      if (found) return found.nombre
    }
    return 'Sin tipo'
  }

  const [showAddDialog, setShowAddDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState({
    waste_type_id: '',
    volume: '',
    weight: '',
    value: '',
    quality: '',
  })

  useEffect(() => {
    fetchWasteItems()
  }, [fetchWasteItems])

  // Check if user can edit (Admin or Operador)
  const canEdit = user?.rol === 'admin' || user?.rol === 'operador'

  const handleAddItem = async () => {
    setError(null)
    
    // Validation
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
    if (!newItem.value || parseFloat(newItem.value) < 0) {
      setError('El valor no puede ser negativo')
      return
    }

    try {
      await createWasteItem({
        waste_type_id: parseInt(newItem.waste_type_id),
        volume: parseFloat(newItem.volume),
        weight: parseFloat(newItem.weight),
        value: parseFloat(newItem.value),
        quality: newItem.quality || null,
      })
      setShowAddDialog(false)
      setNewItem({ waste_type_id: '', volume: '', weight: '', value: '', quality: '' })
      setError(null)
    } catch (error: any) {
      console.error('Error adding waste item:', error)
      setError(error?.message || 'Error al agregar el item. Verifica que tienes permisos.')
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este item?')) {
      try {
        await deleteWasteItem(id)
      } catch (error) {
        console.error('Error deleting waste item:', error)
        alert('Error al eliminar el item')
      }
    }
  }

  const totalVolume = wasteItems.reduce((sum, item) => sum + (item.volume || 0), 0)
  const totalWeight = wasteItems.reduce((sum, item) => sum + (item.weight || 0), 0)
  const totalValue = wasteItems.reduce((sum, item) => sum + (item.value || 0), 0)

  const getQualityBadge = (quality?: string | null) => {
    if (!quality) return null
    const option = QUALITY_OPTIONS.find(opt => opt.value === quality)
    return option ? option.color : 'bg-slate-100 text-slate-800'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Items de Residuos</CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            {wasteItems.length} {wasteItems.length === 1 ? 'item registrado' : 'items registrados'}
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Item
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Volumen Total</p>
              <p className="font-semibold text-slate-900">{totalVolume.toFixed(2)} m³</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Weight className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Peso Total</p>
              <p className="font-semibold text-slate-900">{totalWeight.toFixed(2)} kg</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Valor Total</p>
              <p className="font-semibold text-slate-900">${totalValue.toLocaleString('es-PA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Waste Items List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500">Cargando items...</span>
          </div>
        ) : wasteItems.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No hay items de residuos registrados</p>
            <p className="text-sm text-slate-400 mt-1">
              {canEdit ? 'Haz clic en "Agregar Item" para comenzar' : 'Contacta a un operador para agregar items'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {wasteItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge className="bg-red-100 text-red-800 font-medium px-3 py-1">
                    {getWasteTypeName(item)}
                  </Badge>
                  
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{item.volume} m³</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Weight className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{item.weight} kg</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">${item.value}</span>
                  </div>
                  
                  {item.quality && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-amber-400" />
                      <Badge className={`text-xs ${getQualityBadge(item.quality)}`}>
                        {item.quality}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="sm:max-w-[500px]">
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
              <div className="space-y-2">
                <Label htmlFor="waste-type">Tipo de Residuo *</Label>
                <Select
                  value={newItem.waste_type_id}
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, waste_type_id: value })
                  }
                >
                  <SelectTrigger id="waste-type">
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="volume">Volumen (m³) *</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newItem.volume}
                    onChange={(e) =>
                      setNewItem({ ...newItem, volume: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newItem.weight}
                    onChange={(e) =>
                      setNewItem({ ...newItem, weight: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor ($) *</Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newItem.value}
                    onChange={(e) =>
                      setNewItem({ ...newItem, value: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality">Calidad</Label>
                  <Select
                    value={newItem.quality || "no-calidad"}
                    onValueChange={(value) =>
                      setNewItem({ ...newItem, quality: value === "no-calidad" ? "" : value })
                    }
                  >
                    <SelectTrigger id="quality">
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
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false)
                setError(null)
              }}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddItem} 
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
      </CardContent>
    </Card>
  )
}
