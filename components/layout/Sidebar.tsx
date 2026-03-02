'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Map,
  Building2,
  Users,
  FileText,
  Upload,
  Menu,
  Trash2,
  X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: '/map',
    label: 'Mapa',
    icon: <Map className="h-5 w-5" />,
  },
  {
    href: '/locations',
    label: 'Ubicaciones',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    href: '/users',
    label: 'Usuarios',
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    href: '/audit',
    label: 'Auditoría',
    icon: <FileText className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    href: '/import',
    label: 'Importar',
    icon: <Upload className="h-5 w-5" />,
  },
]

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Trash2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Residuos PA
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onItemClick}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 text-center">
          © 2026 Residuos Panamá
        </p>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col fixed h-full z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-white shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r-0">
          <SidebarContent onItemClick={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  )
}
