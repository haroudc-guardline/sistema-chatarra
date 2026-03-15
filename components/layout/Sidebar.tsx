'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  ChevronLeft,
  ChevronRight,
  Leaf,
  ShoppingCart,
  Package,
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
    href: '/inventory',
    label: 'Inventario',
    icon: <Package className="h-5 w-5" />,
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
  {
    href: '/sales',
    label: 'Ventas',
    icon: <ShoppingCart className="h-5 w-5" />,
  },
]

function SidebarContent({ 
  onItemClick, 
  isCollapsed = false, 
  toggleCollapse 
}: { 
  onItemClick?: () => void
  isCollapsed?: boolean
  toggleCollapse?: () => void
}) {
  const pathname = usePathname()
  const { isAdmin } = useAuth()

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white transition-all duration-300">
        {/* Logo */}
        <div className={cn(
          "h-16 flex items-center border-b border-slate-800/50 transition-all duration-300 overflow-hidden",
          isCollapsed ? "justify-center px-0" : "px-4 justify-between"
        )}>
          <Link href="/" className="flex items-center gap-3" onClick={onItemClick}>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 blur-lg rounded-full" />
              <div className="relative h-10 w-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white whitespace-nowrap leading-tight">
                  Residuos PA
                </span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  Sistema Nacional
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className={cn("space-y-1", isCollapsed ? "px-2" : "px-3")}>
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
              
              const LinkContent = (
                <Link
                  href={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                    isCollapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                  )}
                  <span className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="whitespace-nowrap relative z-10">{item.label}</span>
                  )}
                </Link>
              )

              if (isCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {LinkContent}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-slate-800 text-white border-slate-700 ml-2">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.href}>{LinkContent}</div>
            })}
          </nav>
        </ScrollArea>

        {/* Footer / Toggle */}
        <div className={cn(
          "border-t border-slate-800/50 flex flex-col items-center gap-3 transition-all duration-300",
          isCollapsed ? "py-4 px-2" : "p-4"
        )}>
          {toggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="hidden lg:flex h-8 w-8 text-slate-500 hover:text-white hover:bg-slate-800 rounded-full shrink-0"
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Leaf className="h-3 w-3 text-emerald-500" />
              <span>© 2026 Residuos Panamá</span>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col fixed h-full z-40 transition-all duration-300 shadow-2xl",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 bg-white shadow-lg hover:bg-slate-100 rounded-xl h-11 w-11"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r-0 bg-slate-900">
          <SidebarContent onItemClick={() => setIsOpen(false)} isCollapsed={false} />
        </SheetContent>
      </Sheet>

      {/* Spacer for desktop */}
      <div 
        className={cn(
          "hidden lg:block flex-shrink-0 transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )} 
      />
    </>
  )
}
