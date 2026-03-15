'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocation } from '@/hooks/useLocations'
import { LocationForm } from '@/components/forms/LocationForm'
import { locationService } from '@/lib/services/location-service'
import { wasteItemService } from '@/lib/services/waste-item-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { Location, WasteItem } from '@/types/database'
import type { PendingWasteItem } from '@/components/waste/InlineWasteItemEditor'

export default function EditLocationPage() {
  const params = useParams()
  const router = useRouter()
  const locationId = parseInt(params.id as string)
  const { location, isLoading, updateLocation, isUpdating } = useLocation(locationId)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [existingItems, setExistingItems] = useState<Array<{
    id: number
    waste_type_name: string
    subcategoria?: string | null
    volume: number
    weight: number
    value: number
    quality?: string | null
  }>>([])

  // Load existing waste items for this location
  useEffect(() => {
    if (!locationId) return
    const loadItems = async () => {
      try {
        const response = await fetch(`/api/locations/${locationId}/waste-items`)
        if (response.ok) {
          const items: WasteItem[] = await response.json()
          setExistingItems(items.map(item => ({
            id: item.id,
            waste_type_name: item.waste_type?.nombre || 'Sin tipo',
            subcategoria: item.subcategoria,
            volume: item.volume,
            weight: item.weight,
            value: item.value,
            quality: item.quality,
          })))
        }
      } catch (e) {
        console.error('Error loading existing items:', e)
      }
    }
    loadItems()
  }, [locationId])

  const handleSubmit = async (
    data: Omit<Location, 'id' | 'created_at' | 'updated_at'>,
    wasteTypeIds: number[],
    pendingItems: PendingWasteItem[]
  ) => {
    setSubmitError(null)
    try {
      await updateLocation(data)

      // Sync waste type associations
      const existingTypeIds = location?.waste_types?.map((wt) => wt.id) ?? []
      // Combine existing waste type associations with new ones from pending items
      const allWasteTypeIds = [...new Set([...existingTypeIds, ...wasteTypeIds])]
      const toAdd = allWasteTypeIds.filter((id) => !existingTypeIds.includes(id))

      await Promise.all(
        toAdd.map((wId) => locationService.addWasteType(locationId, wId))
      )

      // Create new waste items
      for (const item of pendingItems) {
        const response = await fetch(`/api/locations/${locationId}/waste-items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            waste_type_id: item.waste_type_id,
            subcategoria: item.subcategoria,
            volume: item.volume,
            weight: item.weight,
            value: item.value,
            quality: item.quality,
          }),
        })

        if (response.ok && item.pendingPhotos.length > 0) {
          const createdItem = await response.json()
          try {
            await wasteItemService.uploadPhotos(createdItem.id, item.pendingPhotos)
          } catch (e) {
            console.error('Error uploading photos for item:', e)
          }
        }
      }

      router.push(`/locations/${locationId}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar la ubicación'
      setSubmitError(message)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[600px]" />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-slate-900">Ubicación no encontrada</h1>
        <Button className="mt-4" onClick={() => router.push('/locations')}>
          Volver a Ubicaciones
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/locations/${locationId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Ubicación</h1>
          <p className="text-slate-500 mt-1">
            Modifica los datos de {location.nombre_institucion}
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-6">
          <LocationForm
            mode="edit"
            initialData={location}
            initialExistingItems={existingItems}
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
