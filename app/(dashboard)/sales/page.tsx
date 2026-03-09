'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useSales } from '@/hooks/useSales'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  ShoppingCart,
  Plus,
  TrendingUp,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
  DollarSign,
  Settings,
  Loader2,
} from 'lucide-react'
import type { SaleListingStatus, MarketPrice } from '@/types/database'

const STATUS_LABELS: Record<SaleListingStatus, { label: string; color: string }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700' },
  active: { label: 'Activa', color: 'bg-green-100 text-green-700' },
  closed: { label: 'Cerrada', color: 'bg-slate-200 text-slate-500' },
}

function fmt(n: number) {
  return n.toLocaleString('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

function MarketPriceModal({
  open,
  onClose,
  marketPrices,
  onSave,
  isSaving,
}: {
  open: boolean
  onClose: () => void
  marketPrices: MarketPrice[]
  onSave: (id: number, updates: { price_per_kg: number; price_per_m3: number }) => Promise<void>
  isSaving: boolean
}) {
  const [edits, setEdits] = useState<Record<number, { price_per_kg: string; price_per_m3: string }>>({})

  const handleSave = async () => {
    for (const [idStr, vals] of Object.entries(edits)) {
      const id = parseInt(idStr)
      const price_per_kg = parseFloat(vals.price_per_kg)
      const price_per_m3 = parseFloat(vals.price_per_m3)
      if (!isNaN(price_per_kg) && !isNaN(price_per_m3)) {
        await onSave(id, { price_per_kg, price_per_m3 })
      }
    }
    setEdits({})
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-600" />
            Precios de Mercado
          </DialogTitle>
          <DialogDescription>
            Actualiza los precios de referencia por tipo de residuo. Se usan para calcular precios sugeridos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {marketPrices.map((mp) => {
            const edit = edits[mp.id] ?? {
              price_per_kg: mp.price_per_kg.toString(),
              price_per_m3: mp.price_per_m3.toString(),
            }
            return (
              <div key={mp.id} className="grid grid-cols-3 gap-3 items-center p-3 border rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{mp.waste_type?.nombre}</p>
                  <p className="text-xs text-slate-400">{mp.waste_type?.categoria}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">$/kg</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={edit.price_per_kg}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [mp.id]: { ...edit, price_per_kg: e.target.value },
                      }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">$/m³</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={edit.price_per_m3}
                    onChange={(e) =>
                      setEdits((prev) => ({
                        ...prev,
                        [mp.id]: { ...edit, price_per_m3: e.target.value },
                      }))
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Precios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function SalesPage() {
  const { isAdmin } = useAuth()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [showPricesModal, setShowPricesModal] = useState(false)
  const [deleteId, setDeleteId] = useState<number | null>(null)

  const { listings, marketPrices, isLoading, deleteListing, isDeleting, updateMarketPrice, isUpdatingPrice } =
    useSales(statusFilter !== 'all' ? { status: statusFilter } : undefined)

  const filtered = (listings ?? []).filter((l) =>
    search ? l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.location?.nombre_institucion?.toLowerCase().includes(search.toLowerCase()) : true
  )

  const stats = {
    total: listings?.length ?? 0,
    active: listings?.filter((l) => l.status === 'active').length ?? 0,
    draft: listings?.filter((l) => l.status === 'draft').length ?? 0,
    totalValue: listings?.reduce((sum, l) => sum + (l.total_suggested_price ?? 0), 0) ?? 0,
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
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              Ventas de Chatarra
            </h1>
            <p className="text-slate-500 text-sm">
              Gestiona ofertas de venta de residuos y notifica compradores potenciales
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPricesModal(true)}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Precios de Mercado
              </Button>
            )}
            <Button asChild className="bg-red-600 hover:bg-red-700 gap-2">
              <Link href="/sales/new">
                <Plus className="h-4 w-4" />
                Nueva Oferta
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Ofertas', value: stats.total, icon: ShoppingCart, color: 'text-slate-600' },
            { label: 'Activas', value: stats.active, icon: CheckCircle, color: 'text-green-600' },
            { label: 'Borradores', value: stats.draft, icon: Clock, color: 'text-amber-600' },
            { label: 'Valor Total', value: fmt(stats.totalValue), icon: DollarSign, color: 'text-red-600' },
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
              placeholder="Buscar por título o institución..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Listings */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingCart className="h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600 font-semibold">No hay ofertas registradas</p>
              <p className="text-slate-400 text-sm mt-1">
                Crea una nueva oferta para comenzar a gestionar ventas
              </p>
              <Button asChild className="mt-4 bg-red-600 hover:bg-red-700 gap-2">
                <Link href="/sales/new">
                  <Plus className="h-4 w-4" />
                  Nueva Oferta
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((listing) => {
              const status = STATUS_LABELS[listing.status as SaleListingStatus] ?? STATUS_LABELS.draft
              return (
                <Card
                  key={listing.id}
                  className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle className="text-base font-semibold text-slate-900 truncate">
                          {listing.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <Building2 className="h-3 w-3 shrink-0" />
                          <span className="truncate">
                            {listing.location?.nombre_institucion ?? 'Institución'} — {listing.location?.ciudad}
                          </span>
                        </CardDescription>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-3 space-y-0.5">
                        <p className="text-xs text-slate-500">Valor mercado</p>
                        <p className="text-sm font-semibold text-slate-700">{fmt(listing.total_market_value)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3 space-y-0.5">
                        <p className="text-xs text-red-500">Precio sugerido</p>
                        <p className="text-sm font-bold text-red-700">{fmt(listing.total_suggested_price)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {new Date(listing.created_at).toLocaleDateString('es-PA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button asChild size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-xs h-8">
                        <Link href={`/sales/${listing.id}`}>Ver detalles</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:border-red-300"
                        onClick={() => setDeleteId(listing.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Market Prices Modal (admin) */}
      {isAdmin && marketPrices && (
        <MarketPriceModal
          open={showPricesModal}
          onClose={() => setShowPricesModal(false)}
          marketPrices={marketPrices}
          onSave={(id, updates) => updateMarketPrice({ id, updates })}
          isSaving={isUpdatingPrice}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar esta oferta de venta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (deleteId) {
                  await deleteListing(deleteId)
                  setDeleteId(null)
                }
              }}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
