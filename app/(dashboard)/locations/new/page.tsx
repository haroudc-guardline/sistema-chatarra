'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocations } from '@/hooks/useLocations'
import { LocationForm } from '@/components/forms/LocationForm'
import { locationService } from '@/lib/services/location-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { Location } from '@/types/database'

export default function NewLocationPage() {
  const router = useRouter()
  const { createLocation, isCreating } = useLocations()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleSubmit = async (
    data: Omit<Location, 'id' | 'created_at' | 'updated_at'>,
    wasteTypeIds: number[]
  ) => {
    setSubmitError(null)
    try {
      const created = await createLocation(data)

      // Associate selected waste types after the location is created
      if (wasteTypeIds.length > 0 && created?.id) {
        await Promise.all(
          wasteTypeIds.map((wId) => locationService.addWasteType(created.id, wId))
        )
      }

      router.push('/locations')
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
