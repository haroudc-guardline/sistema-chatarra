'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inmuebleService, type InmuebleSearchFilters } from '@/lib/services/inmueble-service'

export function useInmuebleSearch(filters: InmuebleSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockInmuebles', filters],
    queryFn: () => inmuebleService.searchInmuebles(filters),
    staleTime: 30 * 1000,
  })
  return {
    items: data?.data ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    error,
    refetch,
  }
}

export function useInmuebleMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stockInmuebles'] })

  const create = useMutation({
    mutationFn: inmuebleService.createInmueble,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof inmuebleService.updateInmueble>[1] }) =>
      inmuebleService.updateInmueble(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: inmuebleService.deleteInmueble,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function useInmuebleTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inmuebleTypes'],
    queryFn: () => inmuebleService.getInmuebleTypes(),
    staleTime: 5 * 60 * 1000,
  })
  return { types: data ?? [], isLoading, error }
}

export function useInmuebleTypeMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inmuebleTypes'] })

  const create = useMutation({
    mutationFn: (nombre: string) => inmuebleService.createInmuebleType(nombre),
    onSuccess: invalidate,
  })

  return { create }
}

export function useInmuebleActivoTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['inmuebleActivoTypes'],
    queryFn: () => inmuebleService.getActivoTypes(),
    staleTime: 5 * 60 * 1000,
  })
  return { types: data ?? [], isLoading, error }
}

export function useInmuebleActivoTypeMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inmuebleActivoTypes'] })

  const create = useMutation({
    mutationFn: (nombre: string) => inmuebleService.createActivoType(nombre),
    onSuccess: invalidate,
  })

  return { create }
}
