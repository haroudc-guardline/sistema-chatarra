'use client'

import { useRouter } from 'next/navigation'
import { useLocations } from '@/hooks/useLocations'
import { LocationForm } from '@/components/forms/LocationForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import type { Location } from '@/types/database'

export default function NewLocationPage() {
  const router = useRouter()
  const { createLocation, isCreating } = useLocations()

  const handleSubmit = async (data: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    await createLocation(data)
    router.push('/locations')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Ubicación</h1>
          <p className="text-slate-500 mt-1">
            Completa el formulario para registrar una nueva institución
          </p>
        </div>
      </div>

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
