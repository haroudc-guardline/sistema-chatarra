import { ReactNode } from "react"
import { Breadcrumbs, BreadcrumbItem } from "@/components/navigation/Breadcrumbs"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"
import Link from "next/link"

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: {
    label: string
    href?: string
    onClick?: () => void
    icon?: LucideIcon
    variant?: "default" | "outline" | "ghost"
    primary?: boolean
  }[]
}

export function PageHeader({ 
  title, 
  description, 
  breadcrumbs, 
  actions 
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description && (
            <p className="text-slate-500 mt-1">{description}</p>
          )}
        </div>
        
        {actions && actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action, index) => {
              const buttonContent = (
                <>
                  {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                  {action.label}
                </>
              )

              const buttonVariant = action.primary ? "default" : (action.variant || "outline")
              const buttonClass = action.primary 
                ? "bg-red-600 hover:bg-red-700" 
                : ""

              if (action.href) {
                return (
                  <Link key={index} href={action.href}>
                    <Button variant={buttonVariant} className={buttonClass}>
                      {buttonContent}
                    </Button>
                  </Link>
                )
              }

              return (
                <Button 
                  key={index} 
                  variant={buttonVariant} 
                  className={buttonClass}
                  onClick={action.onClick}
                >
                  {buttonContent}
                </Button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
