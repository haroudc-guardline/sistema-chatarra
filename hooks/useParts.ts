'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { partsService, type PartSearchFilters } from '@/lib/services/parts-service'
import type { PartCategory } from '@/types/database'

export function usePartTypes(category: PartCategory) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['partTypes', category],
    queryFn: () => partsService.getPartTypes(category),
    staleTime: 30 * 1000,
  })
  return {
    partTypes: data ?? [],
    isLoading,
    error,
    refetch,
  }
}

export function usePartSearch(category: PartCategory, filters: PartSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['parts', category, filters],
    queryFn: () => partsService.searchParts(category, filters),
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

export function usePartMutations(category: PartCategory) {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['parts', category] })

  const create = useMutation({
    mutationFn: (data: Parameters<typeof partsService.createPart>[1]) =>
      partsService.createPart(category, data),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof partsService.updatePart>[2] }) =>
      partsService.updatePart(category, id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => partsService.deletePart(category, id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function usePartTypeMutations() {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: ({ category, nombre }: { category: PartCategory; nombre: string }) =>
      partsService.createPartType(category, nombre),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['partTypes', variables.category] })
    },
  })

  return { create }
}
