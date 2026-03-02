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
import { Plus, Trash2, Package, Weight, DollarSign, Star } from 'lucide-react'
import type { WasteType } from '@/types/database'

interface WasteItemManagerProps {
  locationId: number
  wasteTypes: WasteType[]
}

export function WasteItemManager({ locationId, wasteTypes }: WasteItemManagerProps) {
  const { isOperador } = useAuth()
  const {
    wasteItems,
    isLoading,
    isCreating,
    fetchWasteItems,
    createWasteItem,
    deleteWasteItem,
  } = useWasteItems(locationId)

  const [showAddDialog, setShowAddDialog] = useState(false)
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

  const handleAddItem = async () => {
    try {
      await createWasteItem({
        waste_type_id: parseInt(newItem.waste_type_id),
        volume: parseFloat(newItem.volume),
        weight: parseFloat(newItem.weight),
        value: parseFloat(newItem.value),
        quality: newItem.quality,
      })
      setShowAddDialog(false)
      setNewItem({ waste_type_id: '', volume: '', weight: '', value: '', quality: '' })
    } catch (error) {
      console.error('Error adding waste item:', error)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este item?')) {
      try {
        await deleteWasteItem(id)
      } catch (error) {
        console.error('Error deleting waste item:', error)
      }
    }
  }

  const totalVolume = wasteItems.reduce((sum, item) => sum + (item.volume || 0), 0)
  const totalWeight = wasteItems.reduce((sum, item) => sum + (item.weight || 0), 0)
  const totalValue = wasteItems.reduce((sum, item) => sum + (item.value || 0), 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Items de Residuos</CardTitle>
        {isOperador && (
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Item
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-500" />
            <div>
              <p className="text-xs text-slate-500">Volumen Total</p>
              <p className="font-semibold">{totalVolume.toFixed(2)} m³</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-slate-500">Peso Total</p>
              <p className="font-semibold">{totalWeight.toFixed(2)} kg</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-slate-500">Valor Total</p>
              <p className="font-semibold">${totalValue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Waste Items List */}
        {isLoading ? (
          <p className="text-center text-slate-500 py-4">Cargando items...</p>
        ) : wasteItems.length === 0 ? (
          <p className="text-center text-slate-500 py-4">
            No hay items de residuos registrados
          </p>
        ) : (
          <div className="space-y-2">
            {wasteItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <Badge className="bg-emerald-100 text-emerald-700">
                    {item.waste_type?.nombre || 'Desconocido'}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Package className="h-3 w-3" />
                    {item.volume} m³
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <Weight className="h-3 w-3" />
                    {item.weight} kg
                  </div>
                  <div className="flex items-center gap-1 text-sm text-slate-600">
                    <DollarSign className="h-3 w-3" />
                    ${item.value}
                  </div>
                  {item.quality && (
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Star className="h-3 w-3" />
                      {item.quality}
                    </div>
                  )}
                </div>
                {isOperador && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-500 hover:text-red-700"
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Item de Residuo</DialogTitle>
              <DialogDescription>
                Ingresa los detalles del nuevo item de residuo.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo de Residuo</Label>
                <Select
                  value={newItem.waste_type_id}
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, waste_type_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {wasteTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Volumen (m³)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.volume}
                    onChange={(e) =>
                      setNewItem({ ...newItem, volume: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
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
                  <Label>Valor ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.value}
                    onChange={(e) =>
                      setNewItem({ ...newItem, value: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Calidad</Label>
                  <Input
                    value={newItem.quality}
                    onChange={(e) =>
                      setNewItem({ ...newItem, quality: e.target.value })
                    }
                    placeholder="Ej: Alta, Media, Baja"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddItem} disabled={isCreating}>
                {isCreating ? 'Agregando...' : 'Agregar Item'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
