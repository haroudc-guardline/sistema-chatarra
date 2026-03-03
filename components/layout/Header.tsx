'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bell, Menu, User, LogOut, Settings, Shield, Trash2 } from 'lucide-react'

interface HeaderProps {
  onMenuToggle?: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-sm">
            <Shield className="h-3 w-3 mr-1" /> Admin
          </Badge>
        )
      case 'operador':
        return (
          <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-sm">
            <User className="h-3 w-3 mr-1" /> Operador
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-200 text-slate-700">
            <User className="h-3 w-3 mr-1" /> {role || 'Viewer'}
          </Badge>
        )
    }
  }

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-slate-100"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </Button>
        
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-md shadow-red-600/20">
            <Trash2 className="h-5 w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Sistema de Gestión de Residuos
            </h1>
            <p className="text-xs text-slate-500 -mt-0.5">República de Panamá</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-slate-100 rounded-full h-10 w-10"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-3 px-2 py-1.5 h-auto hover:bg-slate-100 rounded-xl"
            >
              <Avatar className="h-10 w-10 ring-2 ring-slate-200">
                <AvatarFallback className="bg-gradient-to-br from-blue-950 to-blue-900 text-white text-sm font-semibold">
                  {user?.nombre ? getInitials(user.nombre) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">
                  {user?.nombre || 'Usuario'}
                </p>
                <div className="mt-1">
                  {getRoleBadge(user?.rol)}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 mt-2">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-900">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-500">{user?.email || ''}</p>
            </div>
            <DropdownMenuItem onClick={() => router.push('/profile')} className="py-2.5 cursor-pointer">
              <User className="mr-3 h-4 w-4 text-slate-500" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')} className="py-2.5 cursor-pointer">
              <Settings className="mr-3 h-4 w-4 text-slate-500" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 py-2.5 cursor-pointer"
            >
              <LogOut className="mr-3 h-4 w-4" />
              {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
