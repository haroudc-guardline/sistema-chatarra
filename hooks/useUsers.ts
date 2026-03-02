'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/lib/services/user-service'
import type { Profile, UserRole } from '@/types/database'

export function useUsers() {
  const queryClient = useQueryClient()

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
  })

  const createMutation = useMutation({
    mutationFn: ({
      email,
      password,
      nombre,
      rol,
    }: {
      email: string
      password: string
      nombre: string
      rol: UserRole
    }) => userService.createUser(email, password, nombre, rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Profile> }) =>
      userService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, activo }: { id: string; activo: boolean }) =>
      userService.toggleUserStatus(id, activo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => userService.resetPassword(email),
  })

  return {
    users,
    isLoading,
    error,
    createUser: createMutation.mutateAsync,
    updateUser: updateMutation.mutateAsync,
    deleteUser: deleteMutation.mutateAsync,
    toggleUserStatus: toggleStatusMutation.mutateAsync,
    resetPassword: resetPasswordMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useUser(id: string) {
  const queryClient = useQueryClient()

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getUserById(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Profile>) =>
      userService.updateUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  return {
    user,
    isLoading,
    error,
    updateUser: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
