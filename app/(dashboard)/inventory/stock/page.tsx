'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Car, Wind, Wrench, Building, Armchair, Laptop, ArrowRight } from 'lucide-react'

const CATEGORIES = [
  {
    href: '/inventory/stock/autos',
    icon: Car,
    title: 'Autos',
    description: 'Gestión de vehículos institucionales en inventario activo',
    gradient: 'from-blue-600/90 via-blue-700/85 to-indigo-900/90',
    bgImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2070&auto=format&fit=crop',
    blur1: 'bg-white/10',
    blur2: 'bg-blue-400/20',
  },
  {
    href: '/inventory/stock/aires',
    icon: Wind,
    title: 'Aires Acondicionados',
    description: 'Control de equipos de climatización en operación',
    gradient: 'from-teal-600/90 via-teal-700/85 to-cyan-900/90',
    bgImage: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=2070&auto=format&fit=crop',
    blur1: 'bg-white/10',
    blur2: 'bg-teal-400/20',
  },
  {
    href: '/inventory/stock/herramientas',
    icon: Wrench,
    title: 'Herramientas Eléctricas',
    description: 'Registro de herramientas y equipos eléctricos activos',
    gradient: 'from-orange-600/90 via-orange-700/85 to-amber-900/90',
    bgImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?q=80&w=2070&auto=format&fit=crop',
    blur1: 'bg-white/10',
    blur2: 'bg-orange-400/20',
  },
  {
    href: '/inventory/stock/inmuebles',
    icon: Building,
    title: 'Inmuebles',
    description: 'Gestión de propiedades e inmuebles institucionales',
    gradient: 'from-purple-600/90 via-purple-700/85 to-indigo-900/90',
    bgImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
    blur1: 'bg-white/10',
    blur2: 'bg-purple-400/20',
  },
  {
    href: '/inventory/stock/muebles',
    icon: Armchair,
    title: 'Muebles',
    description: 'Registro de escritorios, mesas, sillas y mobiliario',
    gradient: 'from-green-600/90 via-green-700/85 to-emerald-900/90',
    bgImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop',
    blur1: 'bg-white/10',
    blur2: 'bg-green-400/20',
  },
  {
    href: '/inventory/stock/materiales-electricos',
    icon: Laptop,
    title: 'Materiales Eléctricos',
    description: 'Control de laptops, celulares, impresoras y equipos',
    gradient: 'from-pink-600/90 via-pink-700/85 to-rose-900/90',
    bgImage: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2070&auto=format&fit=crop',
    blur1: 'bg-white/10',
    blur2: 'bg-pink-400/20',
  },
]

export default function StockLandingPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventario General en Stock"
        description="Selecciona la categoría de inventario activo que deseas gestionar"
        breadcrumbs={[
          { label: 'Inventario', href: '/inventory' },
          { label: 'Inventario General en Stock' },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {CATEGORIES.map(({ href, icon: Icon, title, description, gradient, bgImage, blur1, blur2 }) => (
          <Link key={href} href={href} className="group">
            <Card className="relative overflow-hidden rounded-2xl border-0 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer h-full group-hover:-translate-y-1">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${bgImage}")` }} />
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${blur1} blur-2xl`} />
              <div className={`absolute -bottom-10 -left-10 w-32 h-32 rounded-full ${blur2} blur-xl`} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <CardContent className="relative z-10 p-8 flex flex-col items-center text-center text-white min-h-[280px]">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-xl border border-white/30">
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="font-bold text-xl mb-2">{title}</h3>
                <p className="text-white/80 text-sm leading-relaxed mb-6">{description}</p>
                <div className="mt-auto flex items-center gap-2 text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full group-hover:bg-white/30 transition-colors border border-white/20">
                  Ver Inventario <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
