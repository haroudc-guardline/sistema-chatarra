'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useStockExitMutations, useStockItemSearch } from '@/hooks/useStockExits'
import type { StockItemSearchResult } from '@/lib/services/stock-exit-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Car, Wind, Wrench, Loader2, Search, CheckCircle } from 'lucide-react'

const ITEM_TYPE_ICON: Record<string, typeof Car> = {
  vehicle: Car,
  ac_unit: Wind,
  tool: Wrench,
}

const ITEM_TYPE_LABEL: Record<string, string> = {
  vehicle: 'Vehiculo',
  ac_unit: 'A/C',
  tool: 'Herramienta',
}

const exitFormSchema = z.object({
  tipo_salida: z.enum(['Venta', 'Donación', 'Traspaso', 'Permuta', 'Subasta', 'Descarte'], {
    message: 'Selecciona un tipo de salida',
  }),
  valor_venta: z.number().min(0).optional(),
  fecha_salida: z.string().min(1, 'La fecha es requerida'),
  descripcion: z.string().optional(),
  responsable_nombre: z.string().optional(),
  responsable_telefono: z.string().optional(),
  responsable_email: z.string().email('Email inv\u00e1lido').optional().or(z.literal('')),
})

type ExitFormValues = z.infer<typeof exitFormSchema>

interface StockExitDialogProps {
  open: boolean
  onClose: () => void
}

export default function StockExitDialog({ open, onClose }: StockExitDialogProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedItem, setSelectedItem] = useState<StockItemSearchResult | null>(null)
  const [searchCategory, setSearchCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { create } = useStockExitMutations()

  const searchParams = {
    ...(searchCategory !== 'all' ? { category: searchCategory } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  }

  const { items: searchResults, isLoading: isSearching } = useStockItemSearch(searchParams)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<ExitFormValues>({
    resolver: zodResolver(exitFormSchema),
    defaultValues: {
      tipo_salida: undefined,
      valor_venta: undefined,
      fecha_salida: today,
      descripcion: '',
      responsable_nombre: '',
      responsable_telefono: '',
      responsable_email: '',
    },
  })

  const tipoSalida = form.watch('tipo_salida')
  const showValor = tipoSalida === 'Venta' || tipoSalida === 'Subasta'

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1)
      setSelectedItem(null)
      setSearchCategory('all')
      setSearchTerm('')
      setDebouncedSearch('')
      form.reset({
        tipo_salida: undefined,
        valor_venta: undefined,
        fecha_salida: today,
        descripcion: '',
        responsable_nombre: '',
        responsable_telefono: '',
        responsable_email: '',
      })
    }
  }, [open, form, today])

  const handleSelectItem = (item: StockItemSearchResult) => {
    setSelectedItem(item)
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
    setSelectedItem(null)
  }

  const onSubmit = async (values: ExitFormValues) => {
    if (!selectedItem) return

    await create.mutateAsync({
      item_type: selectedItem.item_type as 'vehicle' | 'ac_unit' | 'tool',
      item_id: selectedItem.id,
      location_id: selectedItem.location_id,
      tipo_salida: values.tipo_salida as any,
      valor_venta: values.valor_venta || undefined,
      fecha_salida: values.fecha_salida,
      descripcion: values.descripcion || undefined,
      responsable_nombre: values.responsable_nombre || undefined,
      responsable_telefono: values.responsable_telefono || undefined,
      responsable_email: values.responsable_email || undefined,
    })

    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {step === 1 ? 'Seleccionar Activo' : 'Registrar Salida'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? 'Busca y selecciona el activo que deseas dar de baja del inventario.'
              : `Completa los detalles de la salida para ${selectedItem?.marca} ${selectedItem?.modelo}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {/* Search controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vehicle">Veh\u00edculo</SelectItem>
                  <SelectItem value="ac_unit">Aire Acondicionado</SelectItem>
                  <SelectItem value="tool">Herramienta</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por marca, modelo, placa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Results */}
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                {debouncedSearch
                  ? 'No se encontraron resultados'
                  : 'Escribe para buscar activos en el inventario'}
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden max-h-[40vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Marca / Modelo</TableHead>
                      <TableHead>Identificador</TableHead>
                      <TableHead>Instituci\u00f3n</TableHead>
                      <TableHead>Tipo Activo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((item) => {
                      const Icon = ITEM_TYPE_ICON[item.item_type] ?? Car
                      const isSelected = selectedItem?.id === item.id && selectedItem?.item_type === item.item_type
                      return (
                        <TableRow
                          key={`${item.item_type}-${item.id}`}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-red-50 border-red-200'
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => handleSelectItem(item)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-slate-400" />
                              <span className="text-xs text-slate-500">
                                {ITEM_TYPE_LABEL[item.item_type]}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-sm">
                            {item.marca} {item.modelo}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {item.identifier || '\u2014'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {item.location_name || '\u2014'}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {item.tipo_activo || '\u2014'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedItem && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Selected item summary */}
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                <div className="text-sm">
                  <span className="font-medium text-green-800">
                    {selectedItem.marca} {selectedItem.modelo}
                  </span>
                  {selectedItem.identifier && (
                    <span className="text-green-600 ml-2">({selectedItem.identifier})</span>
                  )}
                  <span className="text-green-500 ml-2">- {selectedItem.location_name}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-auto text-xs"
                  onClick={handleBack}
                >
                  Cambiar
                </Button>
              </div>

              {/* Tipo de salida */}
              <FormField
                control={form.control}
                name="tipo_salida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de salida *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo de salida" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Venta">Venta</SelectItem>
                        <SelectItem value="Donación">Donaci\u00f3n</SelectItem>
                        <SelectItem value="Traspaso">Traspaso</SelectItem>
                        <SelectItem value="Permuta">Permuta</SelectItem>
                        <SelectItem value="Subasta">Subasta</SelectItem>
                        <SelectItem value="Descarte">Descarte</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor de venta */}
              {showValor && (
                <FormField
                  control={form.control}
                  name="valor_venta"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor de venta (USD) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="text-lg font-semibold"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Fecha */}
              <FormField
                control={form.control}
                name="fecha_salida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de salida *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descripcion */}
              <FormField
                control={form.control}
                name="descripcion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripci\u00f3n</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Detalles adicionales sobre la salida..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Responsable */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Responsable</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="responsable_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Nombre" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsable_telefono"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Tel\u00e9fono" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsable_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Email" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Atr\u00e1s
                </Button>
                <Button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={create.isPending}
                >
                  {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrar Salida
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {step === 1 && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
