'use client'

import { useState } from 'react'
import { useAudit } from '@/hooks/useAudit'
import { DataTable } from '@/components/data/DataTable'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronDown, ClipboardList, Filter, History, MapPin } from 'lucide-react'
import type { AuditLog } from '@/types/database'

const entityTypes = [
  { value: 'locations', label: 'Ubicaciones' },
  { value: 'profiles', label: 'Usuarios' },
  { value: 'location_documents', label: 'Documentos' },
]

const actions = [
  { value: 'CREATE', label: 'Crear' },
  { value: 'UPDATE', label: 'Actualizar' },
  { value: 'DELETE', label: 'Eliminar' },
  { value: 'BULK_CREATE', label: 'Importación Masiva' },
  { value: 'LOGIN', label: 'Inicio de Sesión' },
  { value: 'LOGOUT', label: 'Cierre de Sesión' },
]

export default function AuditPage() {
  const [filters, setFilters] = useState<{
    entityType?: string
    action?: string
  }>({})
  const { auditLogs, isLoading } = useAudit(filters)

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
      case 'BULK_CREATE':
        return 'bg-emerald-100 text-emerald-700'
      case 'UPDATE':
        return 'bg-blue-100 text-blue-700'
      case 'DELETE':
        return 'bg-red-100 text-red-700'
      case 'LOGIN':
        return 'bg-purple-100 text-purple-700'
      case 'LOGOUT':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getActionLabel = (action: string) => {
    const found = actions.find((a) => a.value === action)
    return found?.label || action
  }

  const getEntityLabel = (entityType: string) => {
    const found = entityTypes.find((e) => e.value === entityType)
    return found?.label || entityType
  }

  const columns = [
    {
      key: 'created_at',
      header: 'Fecha y Hora',
      cell: (log: AuditLog) => (
        <span className="text-sm text-slate-600">
          {new Date(log.created_at).toLocaleString('es-PA')}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'action',
      header: 'Acción',
      cell: (log: AuditLog) => (
        <Badge className={getActionBadgeColor(log.action)}>
          {getActionLabel(log.action)}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'entity_type',
      header: 'Entidad',
      cell: (log: AuditLog) => (
        <span className="text-sm">{getEntityLabel(log.entity_type)}</span>
      ),
      sortable: true,
    },
    {
      key: 'user',
      header: 'Usuario',
      cell: (log: AuditLog) => (
        <span className="text-sm">
          {(log as unknown as { profiles?: { nombre: string; email: string } }).profiles?.nombre || 'Sistema'}
        </span>
      ),
    },
  ]

  const renderExpandedRow = (log: AuditLog) => {
    const hasChanges = log.old_data || log.new_data
    if (!hasChanges) return null

    return (
      <div className="p-4 bg-slate-50 rounded-lg mt-2">
        <h4 className="text-sm font-semibold mb-2">Detalles del cambio:</h4>
        <div className="grid grid-cols-2 gap-4">
          {log.old_data && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Datos Anteriores:</p>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(log.old_data, null, 2)}
              </pre>
            </div>
          )}
          {log.new_data && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Datos Nuevos:</p>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-32">
                {JSON.stringify(log.new_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Auditoría</h1>
          <p className="text-slate-500 mt-1">
            Historial de cambios en el sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Tipo de Entidad
              </label>
              <Select
                value={filters.entityType}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    entityType: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Acción
              </label>
              <Select
                value={filters.action}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    action: value === 'all' ? undefined : value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las acciones</SelectItem>
                  {actions.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Registro de Actividad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && (!auditLogs || auditLogs.length === 0) ? (
            <EmptyState
              icon={ClipboardList}
              title="No hay registros de auditoría"
              description="Los cambios realizados en el sistema aparecerán aquí. Comienza gestionando ubicaciones o usuarios."
              action={{
                label: "Ver Ubicaciones",
                href: "/locations",
                icon: MapPin,
              }}
            />
          ) : (
            <DataTable
              data={auditLogs}
              columns={columns}
              isLoading={isLoading}
              keyExtractor={(log) => log.id}
              emptyMessage="No hay registros de auditoría"
              renderExpandedRow={renderExpandedRow}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
