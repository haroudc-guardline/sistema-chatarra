'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocations } from '@/hooks/useLocations'
import { VehicleForm } from '@/components/forms/VehicleForm'
import { stockItemService } from '@/lib/services/stock-item-service'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'

export default function AddVehiclePage() {
  const router = useRouter()
  const { locations, isLoading } = useLocations()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: any, files: File[]) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      const vehicle = await stockItemService.createVehicle(data)

      if (!vehicle?.id) {
        throw new Error('Error al crear el vehiculo')
      }

      if (files.length > 0) {
        await stockItemService.uploadPhotos('vehicle', vehicle.id, files)
      }

      router.push('/inventory/stock/autos')
    } catch (err: unknown) {
      console.error('Error creating vehicle:', err)
      const message =
        err instanceof Error ? err.message : 'Error inesperado al guardar el vehiculo'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/inventory/stock/autos')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/inventory/stock/autos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Vehiculo</h1>
          <p className="text-slate-500 mt-1">
            Completa el formulario para registrar un nuevo vehiculo
          </p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <VehicleForm
        locations={locations || []}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
