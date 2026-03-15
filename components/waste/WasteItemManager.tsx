'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useWasteItems } from '@/hooks/useWasteItems'
import { useAuth } from '@/hooks/useAuth'
import { wasteItemService } from '@/lib/services/waste-item-service'
import { WASTE_SUBCATEGORY_SUGGESTIONS } from '@/lib/constants/waste-subcategories'
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
import { Plus, Trash2, Package, Weight, DollarSign, Star, AlertCircle, Loader2, Camera, X, ImageIcon } from 'lucide-react'
import type { WasteType, WasteItemPhoto } from '@/types/database'

interface WasteItemManagerProps {
  locationId: number
  wasteTypes: WasteType[]
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
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newItem, setNewItem] = useState({
    waste_type_id: '',
    subcategoria: '',
    volume: '',
    weight: '',
    value: '',
    quality: '',
  })

  // Photo gallery state
  const [photoGalleryItemId, setPhotoGalleryItemId] = useState<number | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<WasteItemPhoto[]>([])
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<WasteItemPhoto | null>(null)
  const [photoCountMap, setPhotoCountMap] = useState<Record<number, number>>({})
  const galleryFileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingGalleryPhotos, setIsUploadingGalleryPhotos] = useState(false)

  // Get subcategory suggestions based on selected waste type
  const subcategorySuggestions = useMemo(() => {
    if (!newItem.waste_type_id) return []
    const selectedType = wasteTypes.find(wt => wt.id === parseInt(newItem.waste_type_id))
    if (!selectedType) return []
    return WASTE_SUBCATEGORY_SUGGESTIONS[selectedType.nombre] || []
  }, [newItem.waste_type_id, wasteTypes])

  useEffect(() => {
    fetchWasteItems()
  }, [fetchWasteItems])

  // Load photo counts for all items
  const loadPhotoCounts = useCallback(async () => {
    const counts: Record<number, number> = {}
    for (const item of wasteItems) {
      try {
        const photos = await wasteItemService.getPhotos(item.id)
        counts[item.id] = photos.length
      } catch {
        counts[item.id] = 0
      }
    }
    setPhotoCountMap(counts)
  }, [wasteItems])

  useEffect(() => {
    if (wasteItems.length > 0) {
      loadPhotoCounts()
    }
  }, [wasteItems.length, loadPhotoCounts])

  const canEdit = user?.rol === 'admin' || user?.rol === 'operador'

  const handleWeightChange = (weightStr: string) => {
    const w = parseFloat(weightStr) || 0
    const calculatedValue = calculateValue(w)
    setNewItem({
      ...newItem,
      weight: weightStr,
      value: w > 0 ? calculatedValue.toFixed(2) : '',
    })
  }

  const handleAddItem = async () => {
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

    try {
      const createdItem = await createWasteItem({
        waste_type_id: parseInt(newItem.waste_type_id),
        subcategoria: newItem.subcategoria || null,
        volume: parseFloat(newItem.volume),
        weight: parseFloat(newItem.weight),
        value: parseFloat(newItem.value) || calculateValue(parseFloat(newItem.weight)),
        quality: newItem.quality || null,
      })

      // Upload pending photos if any
      if (pendingFiles.length > 0 && createdItem?.id) {
        setIsUploadingPhotos(true)
        try {
          await wasteItemService.uploadPhotos(createdItem.id, pendingFiles)
        } catch (e) {
          console.error('Error uploading photos:', e)
        } finally {
          setIsUploadingPhotos(false)
        }
      }

      setShowAddDialog(false)
      setNewItem({ waste_type_id: '', subcategoria: '', volume: '', weight: '', value: '', quality: '' })
      setPendingFiles([])
      setError(null)
      loadPhotoCounts()
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

  // Pending file management in add dialog
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/'))
    setPendingFiles(prev => [...prev, ...validFiles].slice(0, 10))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Photo gallery
  const openPhotoGallery = async (itemId: number) => {
    setPhotoGalleryItemId(itemId)
    setIsLoadingPhotos(true)
    try {
      const photos = await wasteItemService.getPhotos(itemId)
      setGalleryPhotos(photos)
    } catch {
      setGalleryPhotos([])
    } finally {
      setIsLoadingPhotos(false)
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    if (!photoGalleryItemId) return
    if (!confirm('¿Eliminar esta foto?')) return
    try {
      await wasteItemService.deletePhoto(photoGalleryItemId, photoId)
      setGalleryPhotos(prev => prev.filter(p => p.id !== photoId))
      setPhotoCountMap(prev => ({
        ...prev,
        [photoGalleryItemId]: (prev[photoGalleryItemId] || 1) - 1,
      }))
    } catch {
      alert('Error al eliminar la foto')
    }
  }

  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!photoGalleryItemId) return
    const files = Array.from(e.target.files || []).filter(
      f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/')
    )
    if (!files.length) return

    setIsUploadingGalleryPhotos(true)
    try {
      const uploaded = await wasteItemService.uploadPhotos(photoGalleryItemId, files)
      setGalleryPhotos(prev => [...uploaded, ...prev])
      setPhotoCountMap(prev => ({
        ...prev,
        [photoGalleryItemId]: (prev[photoGalleryItemId] || 0) + uploaded.length,
      }))
    } catch (err: any) {
      alert(err.message || 'Error al subir fotos')
    } finally {
      setIsUploadingGalleryPhotos(false)
      if (galleryFileInputRef.current) galleryFileInputRef.current.value = ''
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
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className="bg-red-100 text-red-800 font-medium px-3 py-1">
                    {getWasteTypeName(item)}
                  </Badge>

                  {item.subcategoria && (
                    <Badge variant="outline" className="text-slate-600 font-medium px-2 py-1">
                      {item.subcategoria}
                    </Badge>
                  )}

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

                  {/* Photo count badge */}
                  <button
                    onClick={() => openPhotoGallery(item.id)}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Ver fotos"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="font-medium">{photoCountMap[item.id] ?? 0}</span>
                  </button>
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
                <Label htmlFor="waste-type">Tipo de Residuo *</Label>
                <Select
                  value={newItem.waste_type_id}
                  onValueChange={(value) =>
                    setNewItem({ ...newItem, waste_type_id: value, subcategoria: '' })
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

              {/* Subcategoria */}
              <div className="space-y-2">
                <Label htmlFor="subcategoria">Subcategoría</Label>
                <Input
                  id="subcategoria"
                  list="subcategoria-suggestions"
                  value={newItem.subcategoria}
                  onChange={(e) => setNewItem({ ...newItem, subcategoria: e.target.value })}
                  placeholder={subcategorySuggestions.length > 0 ? `Ej: ${subcategorySuggestions[0]}` : 'Especifica el item (opcional)'}
                />
                {subcategorySuggestions.length > 0 && (
                  <datalist id="subcategoria-suggestions">
                    {subcategorySuggestions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                )}
                {subcategorySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {subcategorySuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewItem({ ...newItem, subcategoria: s })}
                        className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                          newItem.subcategoria === s
                            ? 'bg-blue-100 border-blue-300 text-blue-700'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Volume and Weight */}
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
                    onChange={(e) => handleWeightChange(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Value (auto-calculated) and Quality */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor ($)</Label>
                  <Input
                    id="value"
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

                {/* Pending file previews */}
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
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false)
                setError(null)
                setPendingFiles([])
              }}>
                Cancelar
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={isCreating || isUploadingPhotos}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                {isCreating || isUploadingPhotos ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isUploadingPhotos ? 'Subiendo fotos...' : 'Agregando...'}
                  </>
                ) : (
                  'Agregar Item'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo Gallery Dialog */}
        <Dialog open={photoGalleryItemId !== null} onOpenChange={(open) => {
          if (!open) {
            setPhotoGalleryItemId(null)
            setGalleryPhotos([])
            setPreviewPhoto(null)
          }
        }}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos del Item
              </DialogTitle>
              <DialogDescription>
                {galleryPhotos.length} {galleryPhotos.length === 1 ? 'foto' : 'fotos'}
              </DialogDescription>
            </DialogHeader>

            {isLoadingPhotos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-2 text-slate-500">Cargando fotos...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Upload button */}
                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => galleryFileInputRef.current?.click()}
                      disabled={isUploadingGalleryPhotos}
                    >
                      {isUploadingGalleryPhotos ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Agregar Fotos
                    </Button>
                    <input
                      ref={galleryFileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={handleGalleryFileUpload}
                    />
                  </div>
                )}

                {galleryPhotos.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <ImageIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay fotos</p>
                    <p className="text-sm text-slate-400 mt-1">
                      {canEdit ? 'Agrega fotos para documentar el estado del item' : ''}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {galleryPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.public_url}
                          alt={photo.file_name}
                          className="w-full h-40 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setPreviewPhoto(photo)}
                        />
                        {canEdit && (
                          <button
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Full Size Photo Preview */}
        <Dialog open={previewPhoto !== null} onOpenChange={(open) => {
          if (!open) setPreviewPhoto(null)
        }}>
          <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-2">
            {previewPhoto && (
              <img
                src={previewPhoto.public_url}
                alt={previewPhoto.file_name}
                className="w-full h-full max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
