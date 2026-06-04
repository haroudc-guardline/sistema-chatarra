'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { INCIDENCIA_LABELS } from '@/lib/inmueble-constants'
import type { IncidenciaTipo } from '@/types/database'

async function fetchIncidencias(inmuebleId: number): Promise<IncidenciaTipo[]> {
  const res = await fetch(`/api/stock-items/inmuebles/${inmuebleId}/radiografia`)
  if (!res.ok) throw new Error('Error al obtener incidencias')
  const data = await res.json()
  return data.incidencias ?? []
}

export function IncidenciasTab({ inmuebleId }: { inmuebleId: number }) {
  const { data: incidencias, isLoading } = useQuery({
    queryKey: ['inmuebleIncidencias', inmuebleId],
    queryFn: () => fetchIncidencias(inmuebleId),
    enabled: !!inmuebleId,
  })

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  }

  if (!incidencias || incidencias.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">Sin incidencias</p>
          <p className="text-xs text-slate-400 mt-1">Este inmueble tiene la información completa.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Este inmueble tiene <span className="font-medium text-slate-900">{incidencias.length}</span> incidencia(s) que resolver:
      </p>
      <div className="space-y-2">
        {incidencias.map((inc) => (
          <Card key={inc}>
            <CardContent className="p-3 flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm text-slate-700">{INCIDENCIA_LABELS[inc] || inc}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
