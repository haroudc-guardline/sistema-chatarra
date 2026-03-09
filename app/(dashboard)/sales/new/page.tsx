'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSales, useLocationWasteItems } from '@/hooks/useSales'
import { useLocations } from '@/hooks/useLocations'
import { calcSuggestedPrice, getQualityFactor } from '@/lib/services/sales-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Package,
  DollarSign,
  AlertCircle,
  Loader2,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react'
import type { WasteItem } from '@/types/database'
import { cn } from '@/lib/utils'

const QUALITY_FACTOR_LABEL: Record<string, string> = {
  alta: '100%',
  media: '80%',
  baja: '60%',
}

function fmt(n: number) {
  return n.toLocaleString('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

type Step = 1 | 2

export default function NewSalePage() {
  const router = useRouter()
  const { locations } = useLocations()
  const { marketPrices, createListing, isCreating } = useSales()

  const [step, setStep] = useState<Step>(1)
  const [error, setError] = useState<string | null>(null)

  // Step 1 state
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'draft' | 'active'>('active')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [expiresAt, setExpiresAt] = useState('')

  // Step 2 state — selected waste items
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set())
  const [customPrices, setCustomPrices] = useState<Record<number, string>>({})

  const { data: wasteItems, isLoading: loadingItems } = useLocationWasteItems(selectedLocationId)
  const selectedLocation = locations?.find((l) => l.id === selectedLocationId)

  // Pre-fill contact from location when selected
  const handleLocationChange = (id: number) => {
    setSelectedLocationId(id)
    setSelectedItemIds(new Set())
    const loc = locations?.find((l) => l.id === id)
    if (loc) {
      setContactName(loc.nombre_responsable ?? '')
      setContactEmail(loc.email_responsable ?? '')
      setContactPhone(loc.telefono_responsable ?? '')
    }
  }

  const toggleItem = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectAll = () => {
    if (wasteItems) {
      setSelectedItemIds(new Set(wasteItems.map((i) => i.id)))
    }
  }

  const getMarketPrice = (wasteTypeId?: number) => {
    return marketPrices?.find((mp) => mp.waste_type_id === wasteTypeId)
  }

  const computeItem = (item: WasteItem) => {
    const mp = getMarketPrice(item.waste_type_id)
    const pricePerKg = mp?.price_per_kg ?? 0
    const pricePerM3 = mp?.price_per_m3 ?? 0
    const suggested = calcSuggestedPrice(
      item.weight ?? 0,
      item.volume ?? 0,
      pricePerKg,
      pricePerM3,
      item.quality
    )
    const marketValue = Math.max(
      (item.weight ?? 0) * pricePerKg,
      (item.volume ?? 0) * pricePerM3
    )
    const custom = customPrices[item.id] ? parseFloat(customPrices[item.id]) : undefined
    return { pricePerKg, pricePerM3, suggested, marketValue, custom }
  }

  const selectedItems = (wasteItems ?? []).filter((i) => selectedItemIds.has(i.id))
  const totalMarket = selectedItems.reduce((sum, i) => sum + computeItem(i).marketValue, 0)
  const totalSuggested = selectedItems.reduce((sum, i) => {
    const { suggested, custom } = computeItem(i)
    return sum + (custom ?? suggested)
  }, 0)

  const canProceedStep1 =
    selectedLocationId !== null && title.trim().length > 0

  const canSubmit = selectedItems.length > 0

  const handleSubmit = async () => {
    if (!selectedLocationId) return
    setError(null)
    try {
      const items = selectedItems.map((item) => {
        const mp = getMarketPrice(item.waste_type_id)
        return {
          waste_item_id: item.id,
          waste_type_id: item.waste_type_id,
          weight_kg: item.weight ?? 0,
          volume_m3: item.volume ?? 0,
          quality: item.quality ?? undefined,
          market_price_per_kg: mp?.price_per_kg ?? 0,
          market_price_per_m3: mp?.price_per_m3 ?? 0,
          custom_price: customPrices[item.id] ? parseFloat(customPrices[item.id]) : undefined,
        }
      })

      const created = await createListing({
        listing: {
          location_id: selectedLocationId,
          title: title.trim(),
          status,
          notes: notes.trim() || undefined,
          contact_name: contactName.trim() || undefined,
          contact_email: contactEmail.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          expires_at: expiresAt || undefined,
        },
        items,
      })

      router.push(`/sales/${created.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la oferta')
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => (step === 1 ? router.push('/sales') : setStep(1))}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nueva Oferta de Venta</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Paso {step} de 2 — {step === 1 ? 'Información general' : 'Seleccionar materiales'}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
                step === s
                  ? 'bg-red-600 text-white'
                  : step > s
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-200 text-slate-500'
              )}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            <span className={cn('text-sm', step === s ? 'font-medium text-slate-900' : 'text-slate-400')}>
              {s === 1 ? 'Información' : 'Materiales'}
            </span>
            {s < 2 && <div className="w-8 h-px bg-slate-200 mx-1" />}
          </div>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Location & Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-red-600" />
                Ubicación y Datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="location">Institución / Ubicación *</Label>
                <Select
                  value={selectedLocationId?.toString() ?? ''}
                  onValueChange={(v) => handleLocationChange(parseInt(v))}
                >
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Selecciona una ubicación" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {(locations ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id.toString()}>
                        <div className="flex flex-col py-0.5">
                          <span>{l.nombre_institucion}</span>
                          <span className="text-xs text-slate-400">{l.ciudad}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título de la oferta *</Label>
                <Input
                  id="title"
                  placeholder="Ej. Venta de chatarra metálica ferrosa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado inicial</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'draft' | 'active')}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activa (publicar inmediatamente)</SelectItem>
                    <SelectItem value="draft">Borrador (guardar sin publicar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Fecha de vigencia (opcional)</Label>
                <Input
                  id="expires"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Descripción adicional, condiciones de venta, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4 text-red-600" />
                Información de Contacto
              </CardTitle>
              <CardDescription>
                Se pre-completa con los datos del responsable de la ubicación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cname">Nombre del contacto</Label>
                <Input
                  id="cname"
                  placeholder="Nombre completo"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cemail">Email de contacto</Label>
                <Input
                  id="cemail"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cphone">Teléfono de contacto</Label>
                <Input
                  id="cphone"
                  type="tel"
                  placeholder="+507 6000-0000"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              {selectedLocation && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border text-sm text-slate-600">
                  <p className="font-medium text-slate-800 mb-1">{selectedLocation.nombre_institucion}</p>
                  <p>{selectedLocation.direccion}</p>
                  <p>{selectedLocation.ciudad}, {selectedLocation.municipio}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-red-600" />
                    Materiales Disponibles
                  </CardTitle>
                  <CardDescription>
                    Selecciona los items que deseas incluir en la oferta. El precio sugerido se calcula vs el precio de mercado ajustado por calidad.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Seleccionar todo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : !wasteItems || wasteItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Esta ubicación no tiene items de residuos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Table header */}
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    <div className="col-span-1" />
                    <div className="col-span-3">Tipo</div>
                    <div className="col-span-1 text-center">Peso</div>
                    <div className="col-span-1 text-center">Vol.</div>
                    <div className="col-span-1 text-center">Calidad</div>
                    <div className="col-span-2 text-right">Precio mercado</div>
                    <div className="col-span-2 text-right">Sugerido</div>
                    <div className="col-span-1 text-right">Ajuste</div>
                  </div>

                  {wasteItems.map((item) => {
                    const { pricePerKg, pricePerM3, suggested, marketValue } = computeItem(item)
                    const isSelected = selectedItemIds.has(item.id)
                    const factor = getQualityFactor(item.quality)

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'grid grid-cols-12 gap-2 items-center px-3 py-3 rounded-xl border transition-all cursor-pointer',
                          isSelected
                            ? 'border-red-200 bg-red-50/50'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        )}
                        onClick={() => toggleItem(item.id)}
                      >
                        <div className="col-span-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItem(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                          />
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {item.waste_type?.nombre ?? 'Sin tipo'}
                          </p>
                          <p className="text-xs text-slate-400">{item.waste_type?.categoria}</p>
                        </div>
                        <div className="col-span-1 text-center text-xs text-slate-600">
                          {(item.weight ?? 0).toFixed(1)} kg
                        </div>
                        <div className="col-span-1 text-center text-xs text-slate-600">
                          {(item.volume ?? 0).toFixed(2)} m³
                        </div>
                        <div className="col-span-1 text-center">
                          {item.quality ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                item.quality === 'alta'
                                  ? 'border-green-300 text-green-700'
                                  : item.quality === 'media'
                                  ? 'border-amber-300 text-amber-700'
                                  : 'border-slate-300 text-slate-600'
                              )}
                            >
                              {item.quality} ({QUALITY_FACTOR_LABEL[item.quality] ?? '70%'})
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-xs text-slate-500">
                          {fmt(marketValue)}
                        </div>
                        <div className="col-span-2 text-right text-sm font-semibold text-green-700">
                          {fmt(suggested)}
                        </div>
                        <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder={suggested.toFixed(2)}
                            value={customPrices[item.id] ?? ''}
                            onChange={(e) =>
                              setCustomPrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="h-7 text-xs px-2"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals summary */}
          {selectedItems.length > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Items seleccionados</p>
                    <p className="text-xl font-bold text-slate-900">{selectedItems.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Valor de mercado</p>
                    <p className="text-xl font-bold text-slate-700">{fmt(totalMarket)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-red-500 font-medium">Precio sugerido total</p>
                    <p className="text-xl font-bold text-red-700">{fmt(totalSuggested)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => (step === 1 ? router.push('/sales') : setStep(1))}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Cancelar' : 'Anterior'}
        </Button>

        {step === 1 ? (
          <Button
            disabled={!canProceedStep1}
            onClick={() => setStep(2)}
            className="bg-red-600 hover:bg-red-700 gap-2"
          >
            Siguiente
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            disabled={!canSubmit || isCreating}
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 gap-2"
          >
            {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
            <DollarSign className="h-4 w-4" />
            Crear Oferta
          </Button>
        )}
      </div>
    </div>
  )
}
