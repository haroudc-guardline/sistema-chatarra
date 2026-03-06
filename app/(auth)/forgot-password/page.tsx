'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'

const forgotPasswordSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setIsSuccess(true)
    } catch (err) {
      setError('No se pudo enviar el correo de recuperación. Intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className="w-full shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-7 w-7 text-red-700" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            ¡Correo Enviado!
          </CardTitle>
          <CardDescription className="text-slate-500">
            Hemos enviado un enlace de recuperación a tu correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-slate-600">
            Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-red-700 hover:text-red-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center">
            <Trash2 className="h-7 w-7 text-white" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-slate-900">
          Recuperar Contraseña
        </CardTitle>
        <CardDescription className="text-slate-500">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Enlace'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-red-700 hover:text-red-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
      </CardFooter>
    </Card>
  )
}
