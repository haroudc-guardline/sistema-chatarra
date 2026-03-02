'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BulkImport } from '@/components/forms/BulkImport'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Info } from 'lucide-react'

interface ImportRow {
  nombre_institucion: string
  direccion: string
  ciudad: string
  municipio: string
  corregimiento?: string
  latitud: number
  longitud: number
  volumen: number
  peso_estimado: number
  costo_valor: number
  contacto_responsable: string
  nombre_responsable: string
  tipos_residuos: string
}

export default function ImportPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleImport = async (data: ImportRow[]) => {
    setError(null)

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: data }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Error al importar datos')
      }

      return {
        success: result.imported || 0,
        errors: result.errors || 0,
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar datos')
      return { success: 0, errors: data.length }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Importar Datos</h1>
          <p className="text-slate-500 mt-1">
            Carga masiva de ubicaciones desde archivo Excel o CSV
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Consejos para una importación exitosa:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Descarga la plantilla para asegurar el formato correcto</li>
                <li>Verifica que las coordenadas estén en formato decimal</li>
                <li>Los tipos de residuos deben coincidir con los existentes en el sistema</li>
                <li>Revisa la vista previa antes de confirmar la importación</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Component */}
      <BulkImport onImport={handleImport} />
    </div>
  )
}
