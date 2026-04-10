'use client'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package, MapPin, User, Phone, Mail, FileText, Tag, Pencil,
  Hash, Layers,
} from 'lucide-react'
import type { StockPart } from '@/types/database'

const ESTADO_COLORS: Record<string, string> = {
  'Disponible': 'bg-emerald-100 text-emerald-800',
  'En uso': 'bg-blue-100 text-blue-800',
  'Dañada': 'bg-red-100 text-red-800',
  'Dado de baja': 'bg-slate-100 text-slate-600',
}

interface PartDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part: StockPart | null
  onEdit: (part: StockPart) => void
  isAdmin: boolean
  isOperador: boolean
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null
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

export function PartDetailDialog({
  open,
  onOpenChange,
  part,
  onEdit,
  isAdmin,
  isOperador,
}: PartDetailDialogProps) {
  if (!part) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Detalle de Pieza
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-slate-900">
                {part.part_type?.nombre || 'Pieza'}
              </p>
              <p className="text-sm text-slate-500">
                {[part.marca, part.modelo].filter(Boolean).join(' ') || 'Sin marca/modelo'}
              </p>
            </div>
            <Badge className={`text-sm ${ESTADO_COLORS[part.estado] || 'bg-slate-100 text-slate-700'}`}>
              {part.estado}
            </Badge>
          </div>

          {/* Main info */}
          <div className="border-t border-slate-100 pt-3 space-y-0">
            <InfoRow icon={Layers} label="Tipo de Pieza" value={part.part_type?.nombre} />
            <InfoRow icon={Package} label="Marca / Modelo" value={[part.marca, part.modelo].filter(Boolean).join(' ') || undefined} />
            <InfoRow icon={Hash} label="Cantidad" value={part.cantidad} />
            <InfoRow icon={MapPin} label="Institución" value={part.location?.nombre_institucion} />
          </div>

          {/* Marbete */}
          {part.codigo_marbete && (
            <div className="border-t border-slate-100 pt-3">
              <InfoRow icon={Tag} label="Código de Marbete" value={part.codigo_marbete} />
            </div>
          )}

          {/* Responsable */}
          {(part.responsable_nombre || part.responsable_telefono || part.responsable_email) && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Responsable</p>
              <InfoRow icon={User} label="Nombre" value={part.responsable_nombre} />
              <InfoRow icon={Phone} label="Teléfono" value={part.responsable_telefono} />
              <InfoRow icon={Mail} label="Email" value={part.responsable_email} />
            </div>
          )}

          {/* Ubicación */}
          {(part.ubicacion_nombre || part.ubicacion_direccion || part.ubicacion_municipio) && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Ubicación</p>
              <InfoRow icon={MapPin} label="Ubicación" value={[part.ubicacion_nombre, part.ubicacion_direccion, part.ubicacion_municipio].filter(Boolean).join(', ') || undefined} />
            </div>
          )}

          {/* Notas */}
          {part.notas && (
            <div className="border-t border-slate-100 pt-3">
              <InfoRow icon={FileText} label="Notas" value={part.notas} />
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-400">
              Creado: {new Date(part.created_at).toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })}
              {part.updated_at && ` · Actualizado: ${new Date(part.updated_at).toLocaleDateString('es-PA', { year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {(isAdmin || isOperador) && (
            <Button onClick={() => { onOpenChange(false); onEdit(part) }}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar Pieza
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
