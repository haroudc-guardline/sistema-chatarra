'use client'

import { useParams, useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUsers'
import { UserForm } from '@/components/forms/UserForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import type { UserRole } from '@/types/database'

export default function EditUserPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { user, isLoading, updateUser, isUpdating } = useUser(userId)

  const handleSubmit = async (data: {
    nombre: string
    email: string
    rol: UserRole
    activo: boolean
  }) => {
    await updateUser({
      nombre: data.nombre,
      rol: data.rol,
      activo: data.activo,
    })
    router.push('/users')
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-slate-900">Usuario no encontrado</h1>
        <Button className="mt-4" onClick={() => router.push('/users')}>
          Volver a Usuarios
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Editar Usuario</h1>
          <p className="text-slate-500 mt-1">
            Modifica los datos de {user.nombre}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <UserForm
            mode="edit"
            initialData={user}
            onSubmit={handleSubmit}
            isSubmitting={isUpdating}
          />
        </CardContent>
      </Card>
    </div>
  )
}
