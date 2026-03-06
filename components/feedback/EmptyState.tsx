import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    href: string
    icon?: LucideIcon
  }
  secondaryAction?: {
    label: string
    href: string
  }
  children?: ReactNode
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{description}</p>
      
      {children}
      
      <div className="flex flex-col sm:flex-row gap-3">
        {action && (
          <Link href={action.href}>
            <Button className="bg-red-600 hover:bg-red-700">
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          </Link>
        )}
        {secondaryAction && (
          <Link href={secondaryAction.href}>
            <Button variant="ghost">
              {secondaryAction.label}
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Presets para casos comunes
export function EmptyAuditState() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="No hay registros de auditoría"
      description="Los cambios realizados en el sistema aparecerán aquí. Comienza gestionando ubicaciones o usuarios."
      action={{
        label: "Ver Ubicaciones",
        href: "/locations",
      }}
      secondaryAction={{
        label: "Ir al Dashboard",
        href: "/",
      }}
    />
  )
}

export function EmptyLocationsState() {
  return (
    <EmptyState
      icon={MapPin}
      title="No hay ubicaciones registradas"
      description="Comienza agregando la primera institución con residuos al sistema."
      action={{
        label: "Nueva Ubicación",
        href: "/locations/new",
      }}
    />
  )
}

export function EmptyUsersState() {
  return (
    <EmptyState
      icon={Users}
      title="No hay usuarios registrados"
      description="Agrega usuarios para que puedan acceder y gestionar el sistema."
      action={{
        label: "Nuevo Usuario",
        href: "/users/new",
      }}
    />
  )
}

import { ClipboardList, MapPin, Users } from "lucide-react"
