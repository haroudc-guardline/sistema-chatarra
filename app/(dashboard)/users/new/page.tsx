'use client'

import { useRouter } from 'next/navigation'
import { useUsers } from '@/hooks/useUsers'
import { UserForm } from '@/components/forms/UserForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import type { UserRole } from '@/types/database'

export default function NewUserPage() {
  const router = useRouter()
  const { createUser, isCreating } = useUsers()

  const handleSubmit = async (data: {
    nombre: string
    email: string
    rol: UserRole
    activo: boolean
    password?: string
  }) => {
    if (!data.password) {
      throw new Error('Password is required')
    }
    await createUser({
      email: data.email,
      password: data.password,
      nombre: data.nombre,
      rol: data.rol,
    })
    router.push('/users')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nuevo Usuario</h1>
          <p className="text-slate-500 mt-1">
            Crea un nuevo usuario para el sistema
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <UserForm
            mode="create"
            onSubmit={handleSubmit}
            isSubmitting={isCreating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
