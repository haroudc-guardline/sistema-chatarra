'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSaleListing } from '@/hooks/useSales'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  ArrowLeft,
  Building2,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Copy,
  Loader2,
  AlertCircle,
  Package,
  FileText,
} from 'lucide-react'
import type { SaleListingStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<SaleListingStatus, { label: string; icon: React.ReactNode; color: string }> = {
  draft: {
    label: 'Borrador',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  active: {
    label: 'Activa',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  closed: {
    label: 'Cerrada',
    icon: <XCircle className="h-4 w-4" />,
    color: 'bg-slate-100 text-slate-600 border-slate-200',
  },
}

function fmt(n: number) {
  return n.toLocaleString('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}

function SendEmailDialog({
  open,
  onClose,
  listingId,
  onSend,
  isSending,
}: {
  open: boolean
  onClose: () => void
  listingId: number
  onSend: (data: { buyer_name: string; buyer_email: string; buyer_phone?: string; message?: string }) => Promise<void>
  isSending: boolean
}) {
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSend = async () => {
    if (!buyerName.trim() || !buyerEmail.trim()) {
      setError('Nombre y email del comprador son requeridos')
      return
    }
    setError(null)
    try {
      await onSend({
        buyer_name: buyerName.trim(),
        buyer_email: buyerEmail.trim(),
        buyer_phone: buyerPhone.trim() || undefined,
        message: message.trim() || undefined,
      })
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setBuyerName('')
        setBuyerEmail('')
        setBuyerPhone('')
        setMessage('')
        onClose()
      }, 1500)
    } catch {
      setError('Error al enviar el correo. Verifica tu configuración de email.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-red-600" />
            Enviar Oferta por Email
          </DialogTitle>
          <DialogDescription>
            Se enviará un correo con el detalle completo de la oferta al comprador potencial.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-slate-800 font-semibold">Correo enviado exitosamente</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="bname">Nombre del comprador *</Label>
              <Input
                id="bname"
                placeholder="Nombre completo o empresa"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bemail">Email del comprador *</Label>
              <Input
                id="bemail"
                type="email"
                placeholder="comprador@empresa.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bphone">Teléfono (opcional)</Label>
              <Input
                id="bphone"
                type="tel"
                placeholder="+507 6000-0000"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bmsg">Mensaje personalizado (opcional)</Label>
              <Textarea
                id="bmsg"
                placeholder="Añade un mensaje personalizado al correo..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isSending}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar Correo
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function SaleDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = parseInt(params.id as string)

  const { listing, isLoading, updateStatus, isUpdatingStatus, createInquiry, isCreatingInquiry } =
    useSaleListing(id)

  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  const handleSendEmail = async (data: {
    buyer_name: string
    buyer_email: string
    buyer_phone?: string
    message?: string
  }) => {
    const res = await fetch(`/api/sales/${id}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const { error } = await res.json()
      throw new Error(error ?? 'Error al enviar')
    }
    await createInquiry({ sale_listing_id: id, ...data })
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Oferta no encontrada.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const statusCfg = STATUS_CONFIG[listing.status as SaleListingStatus] ?? STATUS_CONFIG.draft
  const discount =
    listing.total_market_value > 0
      ? ((listing.total_market_value - listing.total_suggested_price) / listing.total_market_value) * 100
      : 0

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/sales')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900">{listing.title}</h1>
                <span
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border',
                    statusCfg.color
                  )}
                >
                  {statusCfg.icon}
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {listing.location?.nombre_institucion} — {listing.location?.ciudad}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              {copySuccess ? 'Copiado!' : 'Compartir enlace'}
            </Button>
            <Button
              size="sm"
              onClick={() => setShowEmailDialog(true)}
              className="bg-red-600 hover:bg-red-700 gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar por Email
            </Button>
          </div>
        </div>

        {/* Status change (if not closed) */}
        {listing.status !== 'closed' && (
          <div className="flex items-center gap-3 p-3 bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-xl">
            <p className="text-sm text-slate-600 font-medium">Cambiar estado:</p>
            <Select
              value={listing.status}
              onValueChange={(v) => updateStatus(v as 'draft' | 'active' | 'closed')}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-40 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="closed">Cerrar oferta</SelectItem>
              </SelectContent>
            </Select>
            {isUpdatingStatus && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
        )}

        {/* Price summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Package className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Items incluidos</p>
                <p className="text-xl font-bold text-slate-900">{listing.items?.length ?? 0}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Valor mercado</p>
                <p className="text-xl font-bold text-slate-700">{fmt(listing.total_market_value)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500 to-red-700 border-0 shadow-sm shadow-red-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-red-100">Precio sugerido</p>
                <p className="text-xl font-bold text-white">{fmt(listing.total_suggested_price)}</p>
                {discount > 0 && (
                  <p className="text-xs text-red-200">
                    {discount.toFixed(1)}% por debajo del mercado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items table */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Detalle de Materiales</CardTitle>
                <CardDescription>Comparativa de precio de mercado vs precio sugerido por calidad</CardDescription>
              </CardHeader>
              <CardContent>
                {(listing.items ?? []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Sin materiales en esta oferta</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left pb-3 text-xs font-semibold text-slate-400 uppercase">Tipo</th>
                          <th className="text-center pb-3 text-xs font-semibold text-slate-400 uppercase">Peso</th>
                          <th className="text-center pb-3 text-xs font-semibold text-slate-400 uppercase">Vol.</th>
                          <th className="text-center pb-3 text-xs font-semibold text-slate-400 uppercase">Calidad</th>
                          <th className="text-right pb-3 text-xs font-semibold text-slate-400 uppercase">Mercado</th>
                          <th className="text-right pb-3 text-xs font-semibold text-slate-400 uppercase">Sugerido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {listing.items?.map((item) => {
                          const finalPrice = item.custom_price ?? item.suggested_price
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 pr-4">
                                <p className="font-medium text-slate-800">
                                  {item.waste_type?.nombre ?? 'Sin tipo'}
                                </p>
                                <p className="text-xs text-slate-400">{item.waste_type?.categoria}</p>
                              </td>
                              <td className="py-3 text-center text-slate-600">
                                {item.weight_kg.toFixed(1)} kg
                              </td>
                              <td className="py-3 text-center text-slate-600">
                                {item.volume_m3.toFixed(2)} m³
                              </td>
                              <td className="py-3 text-center">
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
                                    {item.quality}
                                  </Badge>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>
                              <td className="py-3 text-right text-slate-500">
                                {fmt(Math.max(
                                  item.weight_kg * item.market_price_per_kg,
                                  item.volume_m3 * item.market_price_per_m3
                                ))}
                              </td>
                              <td className="py-3 text-right font-semibold text-green-700">
                                {fmt(finalPrice)}
                                {item.custom_price && (
                                  <p className="text-xs text-slate-400 font-normal">ajustado</p>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-red-50/50">
                          <td colSpan={4} className="pt-3 text-sm font-bold text-slate-700">Total</td>
                          <td className="pt-3 text-right text-sm font-bold text-slate-600">
                            {fmt(listing.total_market_value)}
                          </td>
                          <td className="pt-3 text-right text-sm font-bold text-red-700">
                            {fmt(listing.total_suggested_price)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            {/* Contact */}
            <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4 text-red-600" />
                  Contacto Vendedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {listing.contact_name && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {listing.contact_name}
                  </div>
                )}
                {listing.contact_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${listing.contact_email}`} className="text-red-600 hover:underline">
                      {listing.contact_email}
                    </a>
                  </div>
                )}
                {listing.contact_phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {listing.contact_phone}
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 gap-2 text-xs"
                    onClick={() => setShowEmailDialog(true)}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar a comprador
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {listing.notes && (
              <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-red-600" />
                    Notas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 leading-relaxed">{listing.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Inquiries */}
            <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-600" />
                  Correos enviados
                  <Badge variant="secondary" className="ml-auto">
                    {listing.inquiries?.length ?? 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(listing.inquiries ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">
                    Sin correos enviados aún
                  </p>
                ) : (
                  <div className="space-y-2">
                    {listing.inquiries?.map((inq) => (
                      <div key={inq.id} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-xs font-medium text-slate-700">{inq.buyer_name}</p>
                          <p className="text-xs text-slate-400">{inq.buyer_email}</p>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant="outline"
                            className="text-xs bg-green-50 text-green-700 border-green-200"
                          >
                            {inq.status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(inq.sent_at).toLocaleDateString('es-PA')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card className="bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-sm">
              <CardContent className="p-4 space-y-2 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Creada</span>
                  <span>{new Date(listing.created_at).toLocaleDateString('es-PA')}</span>
                </div>
                {listing.expires_at && (
                  <div className="flex justify-between">
                    <span>Vence</span>
                    <span className={
                      new Date(listing.expires_at) < new Date() ? 'text-red-500 font-medium' : ''
                    }>
                      {new Date(listing.expires_at).toLocaleDateString('es-PA')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SendEmailDialog
        open={showEmailDialog}
        onClose={() => setShowEmailDialog(false)}
        listingId={id}
        onSend={handleSendEmail}
        isSending={isCreatingInquiry}
      />
    </>
  )
}
