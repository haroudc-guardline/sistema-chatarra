'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tag, Package, MapPin, User, Phone, Mail, FileText,
  Plus, Pencil, Loader2,
} from 'lucide-react'
import { useMarbeteDetail } from '@/hooks/useMarbetes'
import type { Marbete, StockPart, PartCategory, Location } from '@/types/database'

const ESTADO_COLORS: Record<string, string> = {
  'Disponible': 'bg-emerald-100 text-emerald-800',
  'En uso': 'bg-blue-100 text-blue-800',
  'Dañada': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

interface MarbeteDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  marbete: Marbete | null
  category: PartCategory
  locations: Location[]
  onAddParts: (marbete: Marbete) => void
  onEditMarbete?: (marbete: Marbete) => void
  onViewPart: (part: StockPart) => void
  isAdmin: boolean
  isOperador: boolean
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export function MarbeteDetailDialog({
  open,
  onOpenChange,
  marbete,
  onAddParts,
  onViewPart,
  isAdmin,
  isOperador,
}: MarbeteDetailDialogProps) {
  const { marbete: detail, isLoading } = useMarbeteDetail(open && marbete ? marbete.id : null)
  const data = detail || marbete
  const parts = detail?.parts ?? []

  if (!data) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            Detalle del Marbete
          </DialogTitle>
        </DialogHeader>

        {/* Marbete header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">{data.codigo}</p>
              <p className="text-sm text-slate-500">
                {data.location?.nombre_institucion || '—'}
                {data.location?.municipio && ` · ${data.location.municipio}`}
              </p>
            </div>
            <Badge variant="secondary" className="text-sm">
              {parts.length} pieza{parts.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-x-6 border-t border-slate-100 pt-3">
            <InfoRow icon={Package} label="Marca / Modelo" value={[data.marca, data.modelo].filter(Boolean).join(' ') || undefined} />
            <InfoRow icon={MapPin} label="Institución" value={data.location?.nombre_institucion} />
            <InfoRow icon={User} label="Responsable" value={data.responsable_nombre} />
            <InfoRow icon={Phone} label="Teléfono" value={data.responsable_telefono} />
            <InfoRow icon={Mail} label="Email" value={data.responsable_email} />
            <InfoRow icon={MapPin} label="Ubicación" value={[data.ubicacion_nombre, data.ubicacion_direccion, data.ubicacion_municipio].filter(Boolean).join(', ') || undefined} />
          </div>

          {data.notas && (
            <div className="border-t border-slate-100 pt-3">
              <InfoRow icon={FileText} label="Notas" value={data.notas} />
            </div>
          )}
        </div>

        {/* Parts list */}
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">
              Piezas Asociadas ({parts.length})
            </p>
            {(isAdmin || isOperador) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { onOpenChange(false); onAddParts(data) }}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Agregar Piezas
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500">Cargando piezas...</span>
            </div>
          ) : parts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-10 w-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No hay piezas asociadas a este marbete</p>
            </div>
          ) : (
            <div className="space-y-2">
              {parts.map((part: StockPart) => (
                <Card
                  key={part.id}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => { onOpenChange(false); onViewPart(part) }}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Package className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {part.part_type?.nombre || '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {[part.marca, part.modelo].filter(Boolean).join(' ') || 'Sin marca/modelo'}
                          {' · '}Cantidad: {part.cantidad}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xs ${ESTADO_COLORS[part.estado] || 'bg-slate-100 text-slate-700'}`}>
                      {part.estado}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
