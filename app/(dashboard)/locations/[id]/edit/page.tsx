'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useLocation } from '@/hooks/useLocations'
import { LocationForm } from '@/components/forms/LocationForm'
import { locationService } from '@/lib/services/location-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { Location } from '@/types/database'

export default function EditLocationPage() {
  const params = useParams()
  const router = useRouter()
  const locationId = parseInt(params.id as string)
  const { location, isLoading, updateLocation, isUpdating } = useLocation(locationId)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (
    data: Omit<Location, 'id' | 'created_at' | 'updated_at'>,
    wasteTypeIds: number[]
  ) => {
    setSubmitError(null)
    try {
      await updateLocation(data)

      // Sync waste type associations: remove all existing, then add the new selection
      const existingIds = location?.waste_types?.map((wt) => wt.id) ?? []

      const toRemove = existingIds.filter((id) => !wasteTypeIds.includes(id))
      const toAdd = wasteTypeIds.filter((id) => !existingIds.includes(id))

      await Promise.all([
        ...toRemove.map((wId) => locationService.removeWasteType(locationId, wId)),
        ...toAdd.map((wId) => locationService.addWasteType(locationId, wId)),
      ])

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
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
