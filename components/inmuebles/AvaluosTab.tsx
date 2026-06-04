'use client'

import { useState } from 'react'
import { useInmuebleAvaluos, useInmuebleAvaluoMutations } from '@/hooks/useInmuebles'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Loader2, Plus, FileText, Trash2, CheckCircle2, TrendingUp } from 'lucide-react'
import type { InmuebleAvaluo } from '@/types/database'

function formatCurrency(v?: number | null) {
  if (v == null) return '—'
  return new Intl.NumberFormat('es-PA', { style: 'currency', currency: 'USD' }).format(v)
}
function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function AvaluosTab({ inmuebleId, canEdit }: { inmuebleId: number; canEdit: boolean }) {
  const { avaluos, isLoading } = useInmuebleAvaluos(inmuebleId)
  const { create, update, remove } = useInmuebleAvaluoMutations(inmuebleId)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ monto: '', fecha_avaluo: '', entidad_avaluadora: '', notas: '', es_actual: true })
  const [file, setFile] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const vigente = avaluos.find((a) => a.es_actual)
  // Apreciación: comparar el vigente con el avalúo anterior más reciente (por fecha) que no sea el vigente
  const anteriores = avaluos.filter((a) => !a.es_actual).sort((a, b) => (a.fecha_avaluo < b.fecha_avaluo ? 1 : -1))
  const previo = anteriores[0]
  const apreciacion = vigente && previo && previo.monto > 0
    ? ((vigente.monto - previo.monto) / previo.monto) * 100
    : null

  const handleSubmit = async () => {
    setSubmitError(null)
    const monto = parseFloat(form.monto)
    if (isNaN(monto) || monto < 0) { setSubmitError('Ingresa un monto válido'); return }
    if (!form.fecha_avaluo) { setSubmitError('Selecciona la fecha del avalúo'); return }
    try {
      await create.mutateAsync({
        monto,
        fecha_avaluo: form.fecha_avaluo,
        entidad_avaluadora: form.entidad_avaluadora || undefined,
        notas: form.notas || undefined,
        es_actual: form.es_actual,
        documento: file,
      })
      setOpen(false)
      setForm({ monto: '', fecha_avaluo: '', entidad_avaluadora: '', notas: '', es_actual: true })
      setFile(null)
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Error al registrar avalúo')
    }
  }

  const handleMarcarVigente = async (a: InmuebleAvaluo) => {
    if (a.es_actual) return
    await update.mutateAsync({ avaluoId: a.id, data: { es_actual: true } })
  }

  const handleDelete = async (a: InmuebleAvaluo) => {
    if (!confirm('¿Eliminar este avalúo del historial?')) return
    await remove.mutateAsync(a.id)
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Resumen del vigente + apreciación */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Avalúo vigente (suma)</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(vigente?.monto)}</p>
            <p className="text-xs text-slate-400">{vigente ? `${formatDate(vigente.fecha_avaluo)}` : 'Sin avalúo vigente'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Avalúo anterior</p>
            <p className="text-lg font-semibold text-slate-900">{formatCurrency(previo?.monto)}</p>
            <p className="text-xs text-slate-400">{previo ? formatDate(previo.fecha_avaluo) : 'Sin referencia'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Apreciación</p>
            {apreciacion != null ? (
              <p className={`text-lg font-semibold flex items-center gap-1 ${apreciacion >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                <TrendingUp className="h-4 w-4" />
                {apreciacion >= 0 ? '+' : ''}{apreciacion.toFixed(1)}%
              </p>
            ) : (
              <p className="text-lg font-semibold text-slate-400">—</p>
            )}
            <p className="text-xs text-slate-400">vigente vs. anterior</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700">Historial de avalúos</h3>
        {canEdit && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Registrar avalúo
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {avaluos.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">No hay avalúos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Fecha</th>
                    <th className="text-right text-xs font-medium text-slate-500 px-4 py-3">Monto</th>
                    <th className="text-left text-xs font-medium text-slate-500 px-4 py-3">Entidad</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Documento</th>
                    <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Vigente</th>
                    {canEdit && <th className="text-center text-xs font-medium text-slate-500 px-4 py-3">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {avaluos.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(a.fecha_avaluo)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">{formatCurrency(a.monto)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{a.entidad_avaluadora || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {a.public_url ? (
                          <a href={a.public_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs">
                            <FileText className="h-3.5 w-3.5" /> Ver
                          </a>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.es_actual ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Vigente</Badge>
                        ) : (
                          <span className="text-xs text-slate-400">Referencia</span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {!a.es_actual && (
                              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleMarcarVigente(a)} disabled={update.isPending}>
                                Marcar vigente
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:bg-red-50" onClick={() => handleDelete(a)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar avalúo</DialogTitle>
            <DialogDescription>El avalúo anterior se conserva como referencia; solo el vigente suma en los totales.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto (USD) <span className="text-red-500">*</span></Label>
                <Input type="number" step="0.01" value={form.monto} onChange={(e) => setForm({ ...form, monto: e.target.value })} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Fecha del avalúo <span className="text-red-500">*</span></Label>
                <Input type="date" value={form.fecha_avaluo} onChange={(e) => setForm({ ...form, fecha_avaluo: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Entidad avaluadora</Label>
              <Input value={form.entidad_avaluadora} onChange={(e) => setForm({ ...form, entidad_avaluadora: e.target.value })} placeholder="Empresa / perito" />
            </div>
            <div className="space-y-2">
              <Label>Documento del avalúo (PDF)</Label>
              <Input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea rows={2} value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={form.es_actual} onChange={(e) => setForm({ ...form, es_actual: e.target.checked })} />
              Marcar como avalúo vigente (el que suma)
            </label>
            {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
