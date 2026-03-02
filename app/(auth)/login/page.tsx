'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Loader2 } from 'lucide-react'

export default function SimpleLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email)
    console.log('Password:', password ? '***' : 'empty')
    
    setIsLoading(true)
    setError(null)

    try {
      console.log('Calling supabase.auth.signInWithPassword...')
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Supabase response:', { data, authError })

      if (authError) {
        console.error('Auth error:', authError)
        throw authError
      }

      if (data.session) {
        console.log('Login successful! Session:', data.session)
        console.log('Redirecting to dashboard...')
        router.push('/')
      } else {
        console.error('No session returned')
        throw new Error('No session created')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err?.message || 'Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Trash2 className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-slate-500">
            Sistema de Administración de Residuos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-600"
              disabled={isLoading || !email || !password}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/forgot-password"
            className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
