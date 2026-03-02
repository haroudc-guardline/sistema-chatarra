import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { Fragment } from "react"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-slate-500">
        <li>
          <Link 
            href="/" 
            className="flex items-center hover:text-emerald-600 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="sr-only">Inicio</span>
          </Link>
        </li>
        
        {items.map((item, index) => (
          <Fragment key={index}>
            <li>
              <ChevronRight className="h-4 w-4" />
            </li>
            <li>
              {item.href ? (
                <Link 
                  href={item.href}
                  className="hover:text-emerald-600 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-slate-900 font-medium" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

// Presets comunes
export function LocationsBreadcrumbs() {
  return <Breadcrumbs items={[{ label: "Ubicaciones" }]} />
}

export function NewLocationBreadcrumbs() {
  return (
    <Breadcrumbs 
      items={[
        { label: "Ubicaciones", href: "/locations" },
        { label: "Nueva Ubicación" }
      ]} 
    />
  )
}

export function UsersBreadcrumbs() {
  return <Breadcrumbs items={[{ label: "Usuarios" }]} />
}

export function AuditBreadcrumbs() {
  return <Breadcrumbs items={[{ label: "Auditoría" }]} />
}

export function MapBreadcrumbs() {
  return <Breadcrumbs items={[{ label: "Mapa" }]} />
}

export function ImportBreadcrumbs() {
  return <Breadcrumbs items={[{ label: "Importar Datos" }]} />
}
