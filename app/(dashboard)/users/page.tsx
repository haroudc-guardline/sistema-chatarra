'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useUsers } from '@/hooks/useUsers'
import { DataTable } from '@/components/data/DataTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Edit, Trash2, MoreVertical, Key, UserCheck, UserX } from 'lucide-react'
import type { Profile } from '@/types/database'

export default function UsersPage() {
  const router = useRouter()
  const { users, isLoading, toggleUserStatus, deleteUser, resetPassword, isDeleting } = useUsers()
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null)
  const [userToReset, setUserToReset] = useState<Profile | null>(null)

  const getRoleBadgeColor = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'bg-purple-100 text-purple-700'
      case 'operador':
        return 'bg-blue-100 text-blue-700'
      case 'viewer':
        return 'bg-slate-100 text-slate-700'
      default:
        return 'bg-slate-100 text-slate-700'
    }
  }

  const getRoleLabel = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Administrador'
      case 'operador':
        return 'Operador'
      case 'viewer':
        return 'Visualizador'
      default:
        return rol
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    await deleteUser(userToDelete.id)
    setUserToDelete(null)
  }

  const handleResetPassword = async () => {
    if (!userToReset) return
    await resetPassword(userToReset.email)
    setUserToReset(null)
  }

  const columns = [
    {
      key: 'nombre',
      header: 'Usuario',
      cell: (user: Profile) => (
        <div>
          <p className="font-medium text-slate-900">{user.nombre}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'rol',
      header: 'Rol',
      cell: (user: Profile) => (
        <Badge className={getRoleBadgeColor(user.rol)}>
          {getRoleLabel(user.rol)}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'activo',
      header: 'Estado',
      cell: (user: Profile) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={user.activo}
            onCheckedChange={() => toggleUserStatus({ id: user.id, activo: !user.activo })}
          />
          <span className={user.activo ? 'text-red-700' : 'text-slate-400'}>
            {user.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      cell: (user: Profile) => (
        <span className="text-sm text-slate-500">
          {new Date(user.created_at).toLocaleDateString('es-PA')}
        </span>
      ),
      sortable: true,
    },
  ]

  const rowActions = (user: Profile) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/edit`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setUserToReset(user)}>
          <Key className="mr-2 h-4 w-4" />
          Resetear Contraseña
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setUserToDelete(user)}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="text-slate-500 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <Link href="/users/new">
          <Button className="bg-red-600 hover:bg-red-700">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={users || []}
            columns={columns}
            isLoading={isLoading}
            keyExtractor={(user) => user.id}
            emptyMessage="No hay usuarios registrados"
            rowActions={rowActions}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario &quot;{userToDelete?.nombre}&quot;?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!userToReset} onOpenChange={() => setUserToReset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear Contraseña</DialogTitle>
            <DialogDescription>
              Se enviará un correo a {userToReset?.email} con instrucciones para restablecer la contraseña.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToReset(null)}>
              Cancelar
            </Button>
            <Button onClick={handleResetPassword}>
              Enviar Correo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
