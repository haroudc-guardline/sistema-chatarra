'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Settings,
  Bell,
  Monitor,
  Moon,
  Sun,
  LogOut,
  Shield,
  Info,
  Loader2,
  ArrowLeft,
  Mail,
  CheckCircle2,
} from 'lucide-react'

type ThemeMode = 'system' | 'light' | 'dark'

export default function SettingsPage() {
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()

  const [themeMode, setThemeMode] = useState<ThemeMode>('system')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifSystem, setNotifSystem] = useState(true)
  const [notifUpdates, setNotifUpdates] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
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
      setShowLogoutDialog(false)
    }
  }

  const themeOptions: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
    { value: 'system', label: 'Sistema', icon: <Monitor className="h-4 w-4" /> },
    { value: 'dark', label: 'Oscuro', icon: <Moon className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Background — same pattern as dashboard */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2940&auto=format&fit=crop")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/95 via-slate-100/90 to-blue-50/85" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, hsla(217,91%,60%,0.1) 0px, transparent 50%),
              radial-gradient(at 100% 100%, hsla(150,60%,45%,0.08) 0px, transparent 50%)
            `,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 space-y-6 max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-10 w-10 rounded-xl hover:bg-white/60 backdrop-blur-sm border border-slate-200/60 cursor-pointer"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              Configuración
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Personaliza tu experiencia en el sistema</p>
          </div>
        </div>

        {/* Appearance card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-blue-600" />
              Apariencia
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Elige cómo se ve el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tema de apariencia">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={themeMode === opt.value}
                  onClick={() => setThemeMode(opt.value)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${themeMode === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md shadow-blue-100'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                    }
                  `}
                >
                  {opt.icon}
                  <span className="text-xs font-medium">{opt.label}</span>
                  {themeMode === opt.value && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              La preferencia de tema se guardará en tu navegador.
            </p>
          </CardContent>
        </Card>

        {/* Notifications card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Notificaciones
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Controla qué notificaciones quieres recibir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {[
              {
                id: 'notif-email',
                icon: <Mail className="h-4 w-4 text-slate-500" />,
                label: 'Notificaciones por correo',
                description: 'Recibe alertas de actividad importantes en tu email',
                value: notifEmail,
                onChange: setNotifEmail,
              },
              {
                id: 'notif-system',
                icon: <Bell className="h-4 w-4 text-slate-500" />,
                label: 'Notificaciones del sistema',
                description: 'Alertas en tiempo real dentro de la plataforma',
                value: notifSystem,
                onChange: setNotifSystem,
              },
              {
                id: 'notif-updates',
                icon: <Info className="h-4 w-4 text-slate-500" />,
                label: 'Actualizaciones y novedades',
                description: 'Infórmate sobre nuevas funciones del sistema',
                value: notifUpdates,
                onChange: setNotifUpdates,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors duration-150"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{item.icon}</div>
                  <div>
                    <Label htmlFor={item.id} className="font-medium text-slate-800 cursor-pointer text-sm">
                      {item.label}
                    </Label>
                    <p className="text-slate-500 text-xs mt-0.5">{item.description}</p>
                  </div>
                </div>
                <Switch
                  id={item.id}
                  checked={item.value}
                  onCheckedChange={item.onChange}
                  className="shrink-0 ml-4"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System info card (admin only) */}
        {isAdmin && (
          <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                Información del Sistema
                <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 text-xs ml-1">
                  Admin
                </Badge>
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Datos técnicos visibles solo para administradores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Versión', value: 'v1.0.0' },
                  { label: 'Stack', value: 'Next.js 15' },
                  { label: 'Base de datos', value: 'Supabase' },
                  { label: 'Entorno', value: process.env.NODE_ENV || 'production' },
                  { label: 'Región', value: 'Panamá' },
                  { label: 'Auth', value: 'Supabase Auth' },
                ].map((item) => (
                  <div key={item.label} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
                    <p className="text-slate-500 text-xs font-medium">{item.label}</p>
                    <p className="text-slate-800 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Settings className="h-4 w-4 text-slate-600" />
              Sesión
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Gestiona tu sesión actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-800 text-sm">Sesión activa</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Conectado como <strong className="text-slate-700">{user?.email}</strong>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowLogoutDialog(true)}
                className="shrink-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 rounded-xl transition-colors duration-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <LogOut className="h-5 w-5 text-red-500" />
              Cerrar sesión
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              ¿Estás seguro de que quieres cerrar tu sesión? Tendrás que volver a iniciar sesión para acceder al sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowLogoutDialog(false)}
              disabled={isLoggingOut}
              className="rounded-xl cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl cursor-pointer"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
