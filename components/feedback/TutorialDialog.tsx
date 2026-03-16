'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Package,
  Filter,
  Search,
  Download,
  Upload,
  Map,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from 'lucide-react'

const TUTORIAL_STEPS = [
  {
    icon: <Trash2 className="h-10 w-10 text-red-600" />,
    title: 'Bienvenido al Sistema de Gestión de Residuos',
    description:
      'Este sistema te permite registrar, gestionar y dar seguimiento a los residuos y chatarra en instituciones a nivel nacional. Navega por las diferentes secciones usando el menú lateral.',
  },
  {
    icon: <Building2 className="h-10 w-10 text-blue-600" />,
    title: 'Crear una Ubicación',
    description:
      'Ve a Ubicaciones → Nueva Ubicación. Llena los datos de la institución (nombre, dirección, provincia, municipio, responsable) y agrega los items de residuos directamente en el formulario. Los totales de volumen, peso y valor se calculan automáticamente.',
  },
  {
    icon: <Package className="h-10 w-10 text-red-600" />,
    title: 'Agregar Items de Residuos',
    description:
      'Cada item tiene: tipo de residuo, subcategoría (ej: Computadora, Auto), volumen, peso y fotos. El valor se calcula automáticamente (peso/1000 × $100/ton). Puedes agregar items al crear la ubicación o después en la vista de detalle.',
  },
  {
    icon: <Filter className="h-10 w-10 text-emerald-600" />,
    title: 'Filtrar por Zona, Ciudad y Tipo',
    description:
      'Usa los filtros en Ubicaciones, Mapa e Inventario para buscar por zona geográfica (3 zonas de Panamá), provincia, municipio o tipo de residuo. Los filtros se aplican en tiempo real.',
  },
  {
    icon: <Search className="h-10 w-10 text-purple-600" />,
    title: 'Inventario Global',
    description:
      'La sección de Inventario te permite buscar items de residuos a través de todas las ubicaciones. Filtra por subcategoría, tipo, calidad o zona. Haz clic en un item para ir a su ubicación.',
  },
  {
    icon: <Map className="h-10 w-10 text-teal-600" />,
    title: 'Vista de Mapa',
    description:
      'El Mapa muestra todas las ubicaciones geolocalizadas. Filtra por zona para ver un resumen con total de ubicaciones, items, peso y valor. Haz clic en un marcador para ver los detalles.',
  },
  {
    icon: <Download className="h-10 w-10 text-orange-600" />,
    title: 'Exportar Datos',
    description:
      'En la página de Ubicaciones, usa el botón "Exportar" para descargar los datos en formato Excel. Puedes exportar un resumen general o un reporte detallado con todos los campos.',
  },
  {
    icon: <Upload className="h-10 w-10 text-indigo-600" />,
    title: 'Importar Ubicaciones',
    description:
      'Ve a la sección Importar para cargar ubicaciones desde un archivo Excel (.xlsx). Descarga la plantilla, llénala con los datos y súbela al sistema. Se validarán los datos automáticamente antes de importar.',
  },
]

interface TutorialDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TutorialDialog({ open, onOpenChange }: TutorialDialogProps) {
  const [step, setStep] = useState(0)

  const currentStep = TUTORIAL_STEPS[step]
  const isFirst = step === 0
  const isLast = step === TUTORIAL_STEPS.length - 1

  const handleClose = () => {
    setStep(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-base text-slate-500">
            Paso {step + 1} de {TUTORIAL_STEPS.length}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center text-center py-6 px-4">
          <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
            {currentStep.icon}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-3">
            {currentStep.title}
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 rounded-full transition-all ${
                i === step ? 'w-6 bg-red-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep(s => s - 1)}
            disabled={isFirst}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          {isLast ? (
            <Button size="sm" onClick={handleClose} className="bg-red-600 hover:bg-red-700">
              Entendido
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(s => s + 1)} className="bg-red-600 hover:bg-red-700">
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
