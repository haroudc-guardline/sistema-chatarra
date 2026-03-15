'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocations } from '@/hooks/useLocations'
import { LocationForm } from '@/components/forms/LocationForm'
import { locationService } from '@/lib/services/location-service'
import { wasteItemService } from '@/lib/services/waste-item-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { Location } from '@/types/database'
import type { PendingWasteItem } from '@/components/waste/InlineWasteItemEditor'

export default function NewLocationPage() {
  const router = useRouter()
  const { createLocation, isCreating } = useLocations()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (
    data: Omit<Location, 'id' | 'created_at' | 'updated_at'>,
    wasteTypeIds: number[],
    pendingItems: PendingWasteItem[]
  ) => {
    setSubmitError(null)
    try {
      const created = await createLocation(data)

      if (!created?.id) {
        throw new Error('Error al crear la ubicación')
      }

      // Associate selected waste types
      if (wasteTypeIds.length > 0) {
        await Promise.all(
          wasteTypeIds.map((wId) => locationService.addWasteType(created.id, wId))
        )
      }

      // Create waste items
      for (const item of pendingItems) {
        const response = await fetch(`/api/locations/${created.id}/waste-items`, {
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

      router.push(`/locations/${created.id}`)
    } catch (err: unknown) {
      console.error('Error creating location:', err)
      const message =
        err instanceof Error ? err.message : 'Error inesperado al guardar la ubicación'
      setSubmitError(message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/locations')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Ubicación</h1>
          <p className="text-slate-500 mt-1">
            Completa el formulario para registrar una nueva institución
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
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
