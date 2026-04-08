'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useStockExitSearch, useStockExitMutations } from '@/hooks/useStockExits'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Car,
  Wind,
  Wrench,
  Trash2,
  Loader2,
  PackageOpen,
  DollarSign,
  Heart,
  ArrowRightLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import type { StockExit, TipoSalida } from '@/types/database'
import StockExitDialog from '@/components/forms/StockExitDialog'

const TIPO_SALIDA_BADGE: Record<TipoSalida, string> = {
  Venta: 'bg-green-100 text-green-800',
  'Donaci\ón': 'bg-blue-100 text-blue-800',
  Traspaso: 'bg-purple-100 text-purple-800',
  Permuta: 'bg-amber-100 text-amber-800',
  Subasta: 'bg-teal-100 text-teal-800',
  Descarte: 'bg-red-100 text-red-800',
}

const ITEM_TYPE_ICON: Record<string, typeof Car> = {
  vehicle: Car,
  ac_unit: Wind,
  tool: Wrench,
}

const ITEM_TYPE_LABEL: Record<string, string> = {
  vehicle: 'Veh\ículo',
  ac_unit: 'A/C',
  tool: 'Herramienta',
}

function fmt(n: number) {
  return n.toLocaleString('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function StockExitsPage() {
  const { isAdmin } = useAuth()
  const [search, setSearch] = useState('')
  const [itemType, setItemType] = useState<string>('all')
  const [tipoSalida, setTipoSalida] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const limit = 25

  const filters = {
    ...(search ? { search } : {}),
    ...(itemType !== 'all' ? { item_type: itemType } : {}),
    ...(tipoSalida !== 'all' ? { tipo_salida: tipoSalida } : {}),
    page,
    limit,
  }

  const { items, totalCount, isLoading } = useStockExitSearch(filters)
  const { remove } = useStockExitMutations()

  const totalPages = Math.ceil(totalCount / limit)

  // Stats
  const stats = {
    total: totalCount,
    ventas: items.filter((e) => e.tipo_salida === 'Venta').length,
    donaciones: items.filter((e) => e.tipo_salida === 'Donaci\ón').length,
    otros: items.filter((e) =>
      ['Traspaso', 'Permuta', 'Subasta', 'Descarte'].includes(e.tipo_salida)
    ).length,
  }

  const handleDelete = async () => {
    if (deleteId) {
      await remove.mutateAsync(deleteId)
      setDeleteId(null)
    }
  }

  return (
    <>
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-red-50/80" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/sales" className="hover:text-red-600 transition-colors">
                Salidas
              </Link>
              <span>/</span>
              <span className="text-slate-700">Materiales en Stock</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              Salidas de Materiales en Stock
            </h1>
            <p className="text-slate-500 text-sm">
              Registra y gestiona las salidas de activos del inventario
            </p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 gap-2 shrink-0"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Registrar Salida
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Salidas', value: stats.total, icon: PackageOpen, color: 'text-slate-600' },
            { label: 'Ventas', value: stats.ventas, icon: DollarSign, color: 'text-green-600' },
            { label: 'Donaciones', value: stats.donaciones, icon: Heart, color: 'text-blue-600' },
            { label: 'Otros', value: stats.otros, icon: ArrowRightLeft, color: 'text-purple-600' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Buscar por descripci\ón o responsable..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="flex-1"
            />
            <Select
              value={itemType}
              onValueChange={(v) => {
                setItemType(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="vehicle">Veh\ículo</SelectItem>
                <SelectItem value="ac_unit">Aire Acondicionado</SelectItem>
                <SelectItem value="tool">Herramienta</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={tipoSalida}
              onValueChange={(v) => {
                setTipoSalida(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las salidas</SelectItem>
                <SelectItem value="Venta">Venta</SelectItem>
                <SelectItem value="Donaci\ón">Donaci\ón</SelectItem>
                <SelectItem value="Traspaso">Traspaso</SelectItem>
                <SelectItem value="Permuta">Permuta</SelectItem>
                <SelectItem value="Subasta">Subasta</SelectItem>
                <SelectItem value="Descarte">Descarte</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : items.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <PackageOpen className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-semibold">No hay salidas registradas</p>
              <p className="text-slate-400 text-sm mt-1">
                Registra una nueva salida de material para comenzar
              </p>
              <Button
                className="mt-4 bg-red-600 hover:bg-red-700 gap-2"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Registrar Salida
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo Salida</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Instituci\ón</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((exit: StockExit) => {
                  const Icon = ITEM_TYPE_ICON[exit.item_type] ?? PackageOpen
                  const badgeClass = TIPO_SALIDA_BADGE[exit.tipo_salida as TipoSalida] ?? 'bg-slate-100 text-slate-800'
                  const detail = exit.item_detail
                  const identifier = detail?.placa ?? detail?.numero_serie ?? ''

                  return (
                    <TableRow key={exit.id}>
                      <TableCell className="text-sm text-slate-600">
                        {formatDate(exit.fecha_salida)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${badgeClass} font-medium`}>
                          {exit.tipo_salida}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {detail ? `${detail.marca} ${detail.modelo}` : ITEM_TYPE_LABEL[exit.item_type]}
                            </p>
                            {identifier && (
                              <p className="text-xs text-slate-400">{identifier}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {exit.location?.nombre_institucion ?? '\u2014'}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-slate-700">
                        {exit.valor_venta ? fmt(exit.valor_venta) : '\u2014'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:border-red-300"
                          onClick={() => setDeleteId(exit.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200/50">
                <p className="text-sm text-slate-500">
                  P\ágina {page} de {totalPages} ({totalCount} resultados)
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Create dialog */}
      <StockExitDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar salida</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acci\ón no se puede deshacer. \¿Confirmas que deseas eliminar esta salida de stock?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              {remove.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
