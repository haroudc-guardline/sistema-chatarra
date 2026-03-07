'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  User,
  Shield,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowLeft,
  Lock,
  Edit3,
  Save,
  X,
} from 'lucide-react'

export default function ProfilePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [nombre, setNombre] = useState(user?.nombre || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingReset, setIsSendingReset] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return (
          <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white border-0 shadow-sm text-sm px-3 py-1">
            <Shield className="h-3.5 w-3.5 mr-1.5" /> Administrador
          </Badge>
        )
      case 'operador':
        return (
          <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-0 shadow-sm text-sm px-3 py-1">
            <User className="h-3.5 w-3.5 mr-1.5" /> Operador
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-sm px-3 py-1">
            <User className="h-3.5 w-3.5 mr-1.5" /> Viewer
          </Badge>
        )
    }
  }

  const handleSave = async () => {
    if (!nombre.trim() || nombre.trim().length < 2) {
      setErrorMsg('El nombre debe tener al menos 2 caracteres')
      return
    }
    setIsSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }
      setSuccessMsg('Perfil actualizado correctamente')
      setIsEditing(false)
      // Refresh auth context by reloading profile from Supabase
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setNombre(user?.nombre || '')
    setIsEditing(false)
    setErrorMsg(null)
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return
    setIsSendingReset(true)
    setErrorMsg(null)
    setSuccessMsg(null)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`,
      })
      if (error) throw error
      setSuccessMsg('Se envió un enlace de restablecimiento a tu correo electrónico')
      setTimeout(() => setSuccessMsg(null), 6000)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al enviar el correo')
    } finally {
      setIsSendingReset(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('es-PA', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

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
              Mi Perfil
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Gestiona tu información personal</p>
          </div>
        </div>

        {/* Feedback banners */}
        {successMsg && (
          <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription>{successMsg}</AlertDescription>
          </Alert>
        )}
        {errorMsg && (
          <Alert className="bg-red-50 border-red-200 text-red-800">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Avatar hero card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800" />
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10">
              <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white text-2xl font-bold">
                  {user?.nombre ? getInitials(user.nombre) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="pb-1 space-y-1">
                <h2 className="text-xl font-bold text-slate-900">{user?.nombre || 'Usuario'}</h2>
                <p className="text-slate-500 text-sm flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {user?.email}
                </p>
                <div className="pt-1">{getRoleBadge(user?.rol)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal info card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                Información Personal
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm mt-0.5">
                Actualiza tu nombre para que los demás te identifiquen
              </CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <Edit3 className="h-4 w-4 mr-1.5" />
                Editar
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="nombre" className="text-slate-700 font-medium text-sm">
                Nombre completo
              </Label>
              {isEditing ? (
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="bg-white border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 rounded-xl"
                  autoFocus
                />
              ) : (
                <div className="px-3 py-2.5 bg-slate-50 rounded-xl text-slate-800 font-medium border border-slate-200">
                  {user?.nombre || '—'}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                Correo electrónico
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  value={user?.email || ''}
                  readOnly
                  className="bg-slate-50 border-slate-200 text-slate-500 rounded-xl pr-10 cursor-not-allowed"
                  aria-describedby="email-hint"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <p id="email-hint" className="text-xs text-slate-400">
                El correo es gestionado por el sistema de autenticación y no se puede modificar aquí.
              </p>
            </div>

            {isEditing && (
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Cancelar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-red-600" />
              Seguridad
            </CardTitle>
            <CardDescription className="text-slate-500 text-sm">
              Gestiona el acceso a tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-800 text-sm">Contraseña</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Recibirás un enlace en tu correo para restablecerla de forma segura
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handlePasswordReset}
                disabled={isSendingReset}
                className="shrink-0 border-slate-200 hover:border-red-300 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors duration-200 cursor-pointer"
              >
                {isSendingReset ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {isSendingReset ? 'Enviando...' : 'Cambiar contraseña'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account activity card */}
        <Card className="bg-white/70 backdrop-blur-md shadow-xl border border-slate-200/50 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              Actividad de la cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  Registro
                </div>
                <p className="text-slate-800 text-sm font-medium">
                  {formatDate(user?.created_at)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  Última actualización
                </div>
                <p className="text-slate-800 text-sm font-medium">
                  {formatDate(user?.updated_at)}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                  <Shield className="h-3.5 w-3.5" />
                  Estado
                </div>
                <div className="flex items-center gap-1.5">
                  {user?.activo ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <span className="text-emerald-700 font-medium text-sm">Activo</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-red-700 font-medium text-sm">Inactivo</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
