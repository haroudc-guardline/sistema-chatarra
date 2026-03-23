'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Trash2,
  Warehouse,
  ArrowRight,
  Lock,
} from 'lucide-react'

export default function InventoryLandingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventario"
        description="Selecciona el tipo de inventario que deseas consultar"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Card 1: Materiales de Descarte */}
        <Link href="/inventory/descarte" className="group">
          <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group-hover:-translate-y-1">
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2940&auto=format&fit=crop")`,
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/90 via-red-700/85 to-orange-900/90" />

            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-red-400/20 blur-xl" />

            {/* Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <CardContent className="relative z-10 p-10 flex flex-col items-center text-center text-white min-h-[320px]">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-white/30">
                <Trash2 className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3">Materiales de Descarte</h3>
              <p className="text-red-100 text-sm leading-relaxed mb-8">
                Inventario de materiales descartados por las instituciones del sistema
              </p>
              <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full group-hover:bg-white/30 transition-colors border border-white/20">
                Ver Inventario <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Card 2: Materiales en Stock (Disabled) */}
        <div className="cursor-not-allowed">
          <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg h-full opacity-60">
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop")`,
              }}
            />
            {/* Gradient overlay - gray/slate for disabled state */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-600/90 via-slate-700/85 to-slate-900/90" />

            {/* Decorative elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-slate-400/20 blur-xl" />

            <CardContent className="relative z-10 p-10 flex flex-col items-center text-center text-white min-h-[320px]">
              <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-xl border border-white/30">
                <Warehouse className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-bold text-2xl mb-3">Materiales en Stock</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Gestión de materiales disponibles en inventario activo
              </p>
              <div className="mt-auto flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-sm font-medium bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full border border-white/10">
                  <Lock className="h-4 w-4" />
                  No disponible
                </div>
                <Badge className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1">
                  2da Fase en progreso
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
