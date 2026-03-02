'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, RefreshCw } from 'lucide-react'
import type { Profile, UserRole } from '@/types/database'

const userSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  rol: z.enum(['admin', 'operador', 'viewer'] as const),
  activo: z.boolean(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional(),
})

type UserFormData = z.infer<typeof userSchema>

interface UserFormProps {
  mode: 'create' | 'edit'
  initialData?: Profile
  onSubmit: (data: UserFormData) => Promise<void>
  isSubmitting?: boolean
}

export function UserForm({ mode, initialData, onSubmit, isSubmitting }: UserFormProps) {
  const router = useRouter()
  const [generatedPassword, setGeneratedPassword] = useState('')

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      nombre: initialData?.nombre || '',
      email: initialData?.email || '',
      rol: initialData?.rol || 'viewer',
      activo: initialData?.activo ?? true,
      password: '',
    },
  })

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    form.setValue('password', password)
  }

  const handleSubmit = async (data: UserFormData) => {
    await onSubmit(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre Completo *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre del usuario" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electrónico *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      disabled={mode === 'edit'}
                    />
                  </FormControl>
                  <FormMessage />
                  {mode === 'edit' && (
                    <p className="text-xs text-slate-500">
                      El correo electrónico no se puede modificar
                    </p>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {mode === 'create' && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña *</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          type="text"
                          placeholder="Genera una contraseña"
                          value={field.value || generatedPassword}
                          readOnly
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generatePassword}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                    {generatedPassword && (
                      <p className="text-xs text-emerald-600">
                        Guarda esta contraseña, se mostrará solo una vez
                      </p>
                    )}
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="activo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Usuario Activo</FormLabel>
                    <p className="text-sm text-slate-500">
                      {field.value
                        ? 'El usuario puede iniciar sesión'
                        : 'El usuario no podrá iniciar sesión'}
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : mode === 'create' ? (
              'Crear Usuario'
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
