'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInmuebleRadiografia, useInmuebleTypes } from '@/hooks/useInmuebles'
import { INCIDENCIA_LABELS } from '@/lib/inmueble-constants'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Loader2, AlertTriangle, Download, Search } from 'lucide-react'
import type { IncidenciaTipo } from '@/types/database'

export function RadiografiaTab() {
  const router = useRouter()
  const { types: inmuebleTypes } = useInmuebleTypes()
  const [filters, setFilters] = useState<{ inmueble_type_id?: number; nombre_institucion?: string; anios_avaluo?: number }>({ anios_avaluo: 3 })
  const { report, isLoading } = useInmuebleRadiografia(filters)

  const totalIncidencias = useMemo(
    () => (report?.incidencias_por_tipo ?? []).reduce((s, i) => s + i.count, 0),
    [report]
  )

  const handleExport = useCallback(async () => {
    if (!report) return
    try {
      const XLSX = await import('xlsx')
      const resumen = report.incidencias_por_tipo.map((i) => ({
        'Incidencia': INCIDENCIA_LABELS[i.tipo] || i.tipo,
        'Cantidad': i.count,
      }))
      const detalle = report.inmuebles.map((i) => ({
        'Inmueble': i.nombre,
        'Tipo': i.tipo || '',
        'Institucion': i.nombre_institucion || '',
        'Incidencias': i.incidencias.map((x) => INCIDENCIA_LABELS[x] || x).join(', '),
      }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), 'Resumen')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detalle), 'Detalle')
      XLSX.writeFile(wb, 'radiografia_inmuebles.xlsx')
    } catch {
      alert('Error al exportar. Verifica la libreria xlsx.')
    }
  }, [report])

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Inmueble</Label>
              <Select
                value={filters.inmueble_type_id?.toString() || 'all'}
                onValueChange={(v) => setFilters((p) => ({ ...p, inmueble_type_id: v === 'all' ? undefined : parseInt(v) }))}
              >
                <SelectTrigger className="h-8 text-xs w-[200px]"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {inmuebleTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>{t.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Institución</Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  value={filters.nombre_institucion || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, nombre_institucion: e.target.value || undefined }))}
                  placeholder="Buscar institucion..."
                  className="h-8 text-xs pl-7 w-[230px]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Avalúo desactualizado (años)</Label>
              <Input
                type="number"
                value={filters.anios_avaluo ?? 3}
                onChange={(e) => setFilters((p) => ({ ...p, anios_avaluo: parseInt(e.target.value) || 3 }))}
                className="h-8 text-xs w-[120px]"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleExport} disabled={!report}>
              <Download className="h-3.5 w-3.5" /> Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          <span className="ml-2 text-slate-500">Calculando radiografía...</span>
        </div>
      ) : !report ? null : (
        <>
          {/* Conteos por incidencia */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Inmuebles en alcance</p>
                <p className="text-2xl font-semibold text-slate-900">{report.scope.total_inmuebles}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500">Total de incidencias</p>
                <p className="text-2xl font-semibold text-amber-600">{totalIncidencias}</p>
              </CardContent>
            </Card>
            {report.incidencias_por_tipo.map((i) => (
              <Card key={i.tipo}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <p className="text-xs text-slate-500">{INCIDENCIA_LABELS[i.tipo as IncidenciaTipo] || i.tipo}</p>
                  </div>
                  <p className="text-2xl font-semibold text-slate-900 mt-1">{i.count}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detalle por inmueble */}
          <Card>
            <CardContent className="p-0">
              {report.inmuebles.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">Sin incidencias en el alcance seleccionado</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50">
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Inmueble</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Tipo</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Institución</th>
                        <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Incidencias</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.inmuebles.map((i) => (
                        <tr
                          key={i.id}
                          className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                          onClick={() => router.push(`/inventory/stock/inmuebles/${i.id}`)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-slate-700">{i.nombre}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{i.tipo || '—'}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{i.nombre_institucion || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {i.incidencias.map((inc) => (
                                <Badge key={inc} className="bg-amber-100 text-amber-800 text-[10px]">
                                  {INCIDENCIA_LABELS[inc] || inc}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
