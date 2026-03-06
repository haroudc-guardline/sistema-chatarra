'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Loader2, ArrowRight, Shield, Leaf, Recycle } from 'lucide-react'

export default function SimpleLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (data.session) {
        router.push('/')
      } else {
        throw new Error('No session created')
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Lado Izquierdo - Visual */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-[55%] items-center justify-center overflow-hidden">
        {/* High-quality background image - Industrial/Recycling theme */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=2070&auto=format&fit=crop")`,
          }}
        />
        
        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-slate-950/95" />
        
        {/* Animated mesh gradient overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              radial-gradient(at 0% 0%, hsla(217,91%,50%,0.3) 0px, transparent 50%),
              radial-gradient(at 100% 0%, hsla(190,80%,45%,0.2) 0px, transparent 50%),
              radial-gradient(at 100% 100%, hsla(220,70%,40%,0.3) 0px, transparent 50%),
              radial-gradient(at 0% 100%, hsla(160,60%,35%,0.2) 0px, transparent 50%)
            `,
          }}
        />
        
        {/* Subtle pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
        
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-12 max-w-2xl">
          {/* Logo container */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150" />
            <div className="relative h-24 w-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/30 border border-white/20">
              <Trash2 className="h-12 w-12 text-white" />
            </div>
            {/* Floating icons */}
            <div className="absolute -top-2 -right-8 h-10 w-10 bg-emerald-500/90 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-2 -left-8 h-10 w-10 bg-blue-500/90 rounded-xl flex items-center justify-center shadow-lg">
              <Recycle className="h-5 w-5 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
            Sistema Nacional de{' '}
            <span className="bg-gradient-to-r from-blue-200 to-emerald-200 bg-clip-text text-transparent">
              Administración de Residuos
            </span>
          </h1>
          
          <p className="text-lg text-blue-100/90 mb-8 max-w-md leading-relaxed">
            Plataforma oficial para la gestión, control y trazabilidad de chatarra y materiales reciclables en la República de Panamá.
          </p>
          
          {/* Feature badges */}
          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white/90">Seguro</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Leaf className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white/90">Sostenible</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
              <Recycle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white/90">Eficiente</span>
            </div>
          </div>
          
          {/* Progress indicators */}
          <div className="flex gap-2 items-center justify-center mt-12">
            <div className="h-1.5 w-12 bg-gradient-to-r from-red-500 to-red-400 rounded-full"></div>
            <div className="h-1.5 w-3 bg-white/30 rounded-full"></div>
            <div className="h-1.5 w-3 bg-white/30 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-gradient-to-b from-white to-slate-50/50">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center md:text-left">
            <div className="md:hidden flex justify-center mb-6">
              <div className="relative">
                <div className="h-16 w-16 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/20">
                  <Trash2 className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Bienvenido de vuelta
            </h2>
            <p className="text-slate-500 mt-2">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 rounded-xl">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mt-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 px-4 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm">
                  Contraseña
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 px-4 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-all shadow-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl font-medium text-base transition-all flex items-center justify-center gap-2 group shadow-lg shadow-red-600/20 hover:shadow-xl hover:shadow-red-600/30 border-0"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Ingresando...
                </>
              ) : (
                <>
                  Ingresar al sistema
                  <ArrowRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mt-6">
            <Shield className="h-3 w-3" />
            <span>Conexión segura y encriptada</span>
          </div>

          <div className="text-center mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400">
              © 2026 Sistema Nacional de Residuos - Panamá
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
