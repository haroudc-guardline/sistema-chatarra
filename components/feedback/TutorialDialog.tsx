'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  ChevronDown,
  Trash2,
  BookOpen,
  HelpCircle,
} from 'lucide-react'

// ─── Tutorial Steps ───

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

// ─── FAQs ───

const FAQS = [
  {
    question: '¿Cómo creo una nueva ubicación?',
    answer:
      'Ve a la sección "Ubicaciones" en el menú lateral y haz clic en el botón "+ Nueva Ubicación". Llena el formulario con los datos de la institución, agrega los items de residuos y haz clic en "Crear Ubicación".',
  },
  {
    question: '¿Cómo agrego items de residuos?',
    answer:
      'Puedes agregar items al crear una ubicación o después en la vista de detalle. Haz clic en "+ Agregar Item de Residuo", selecciona el tipo, subcategoría, ingresa volumen y peso. El valor se calcula automáticamente.',
  },
  {
    question: '¿Cómo funciona el cálculo del valor?',
    answer:
      'El valor se calcula automáticamente con la fórmula: Valor = Peso (kg) ÷ 1,000 × $100. Esto equivale a $100 por tonelada. Por ejemplo, 500 kg = $50.00.',
  },
  {
    question: '¿Qué son las zonas geográficas?',
    answer:
      'El sistema divide Panamá en 3 zonas:\n• Zona 1 (Central): Panamá, Panamá Oeste, Colón, Darién\n• Zona 2 (Interior): Veraguas, Coclé, Herrera, Los Santos\n• Zona 3 (Occidente): Chiriquí, Bocas del Toro\n\nPuedes filtrar ubicaciones, inventario y el mapa por zona.',
  },
  {
    question: '¿Cómo exporto datos a Excel?',
    answer:
      'En la página de Ubicaciones, haz clic en el botón "Exportar" en la esquina superior derecha. Puedes elegir entre un resumen general o un reporte detallado.',
  },
  {
    question: '¿Cómo importo ubicaciones desde Excel?',
    answer:
      'Ve a la sección "Importar" en el menú lateral. Descarga la plantilla Excel, llénala con los datos de las ubicaciones y súbela al sistema. Los datos se validarán automáticamente antes de importar.',
  },
  {
    question: '¿Cómo subo fotos de un item de residuo?',
    answer:
      'Al agregar un item, encontrarás la sección "Fotos del Item" donde puedes subir hasta 10 fotos (JPG, PNG, WebP, máximo 5MB cada una). También puedes agregar fotos después en la vista de detalle haciendo clic en el icono de cámara.',
  },
  {
    question: '¿Cómo busco items específicos en todas las ubicaciones?',
    answer:
      'Ve a la sección "Inventario" en el menú lateral. Usa los filtros de zona, tipo de residuo, subcategoría y calidad para encontrar items. Haz clic en una fila para ir a la ubicación del item.',
  },
  {
    question: '¿Quién puede editar y eliminar ubicaciones?',
    answer:
      'Los usuarios con rol "Admin" pueden crear, editar y eliminar ubicaciones. Los "Operadores" pueden crear y editar, pero no eliminar. Los "Viewers" solo pueden ver la información.',
  },
  {
    question: '¿Qué es la subcategoría de un item?',
    answer:
      'La subcategoría permite detallar qué tipo específico de residuo es. Por ejemplo, dentro de "Residuos electrónicos" puedes especificar: Computadora, Televisor, Monitor, etc. Esto permite rastrear cuántos autos, muebles o equipos hay en inventario.',
  },
]

// ─── Component ───

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
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-0">
          <DialogTitle className="sr-only">Ayuda del Sistema</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tutorial" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tutorial" className="flex items-center gap-1.5">
              <BookOpen className="h-4 w-4" />
              Tutorial
            </TabsTrigger>
            <TabsTrigger value="faqs" className="flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" />
              Preguntas Frecuentes
            </TabsTrigger>
          </TabsList>

          {/* Tutorial Tab */}
          <TabsContent value="tutorial" className="flex-1 flex flex-col mt-0">
            <div className="flex flex-col items-center text-center py-6 px-4">
              <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
                {currentStep.icon}
              </div>
              <p className="text-xs text-slate-400 mb-2">
                Paso {step + 1} de {TUTORIAL_STEPS.length}
              </p>
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
            <div className="flex items-center justify-between pt-3 border-t">
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
          </TabsContent>

          {/* FAQs Tab */}
          <TabsContent value="faqs" className="flex-1 overflow-y-auto mt-0">
            <div className="space-y-1 py-2">
              {FAQS.map((faq, i) => (
                <Collapsible key={i}>
                  <CollapsibleTrigger className="flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group">
                    <span className="text-red-500 font-bold text-sm mt-0.5 shrink-0">Q</span>
                    <span className="text-sm font-medium text-slate-800 flex-1">{faq.question}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-0.5 transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mr-3 mb-2 px-3 py-2 bg-slate-50 rounded-lg border-l-2 border-red-200">
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{faq.answer}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
