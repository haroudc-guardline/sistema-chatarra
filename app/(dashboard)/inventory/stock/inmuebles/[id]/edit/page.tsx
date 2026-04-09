'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useLocations } from '@/hooks/useLocations'
import { inmuebleService } from '@/lib/services/inmueble-service'
import { stockItemService } from '@/lib/services/stock-item-service'
import { InmuebleForm } from '@/components/forms/InmuebleForm'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle, Loader2, Building2 } from 'lucide-react'

export default function EditInmueblePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { locations, isLoading: locationsLoading } = useLocations()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: item, isLoading, error } = useQuery({
    queryKey: ['stockInmueble', id],
    queryFn: () => inmuebleService.getInmueble(Number(id)),
  })

  const handleSubmit = async (data: any, files: File[]) => {
    setSubmitError(null)
    setIsSubmitting(true)
    try {
      await inmuebleService.updateInmueble(Number(id), data)

      if (files.length > 0) {
        await stockItemService.uploadPhotos('inmueble', Number(id), files)
      }

      router.push(`/inventory/stock/inmuebles/${id}`)
    } catch (err: unknown) {
      console.error('Error updating inmueble:', err)
      const message =
        err instanceof Error ? err.message : 'Error inesperado al actualizar el inmueble'
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/inventory/stock/inmuebles/${id}`)
  }

  if (isLoading || locationsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <span className="ml-2 text-slate-500">Cargando inmueble...</span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="text-center py-24">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Inmueble no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/inventory/stock/inmuebles')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver al listado
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Inmueble</h1>
          <p className="text-slate-500 mt-1">{item.nombre}</p>
        </div>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <InmuebleForm
        locations={locations || []}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        editItem={item}
      />
    </div>
  )
}
