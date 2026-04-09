'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marbeteService, type MarbeteSearchFilters, type PartInput } from '@/lib/services/marbete-service'
import type { PartCategory } from '@/types/database'

export function useMarbeteSearch(category: PartCategory, filters: MarbeteSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marbetes', category, filters],
    queryFn: () => marbeteService.searchMarbetes({ ...filters, category }),
    staleTime: 30 * 1000,
  })
  return {
    marbetes: data?.data ?? [],
    totalCount: data?.count ?? 0,
    isLoading,
    error,
    refetch,
  }
}

export function useMarbeteDetail(id: number | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['marbete', id],
    queryFn: () => (id ? marbeteService.getMarbete(id) : null),
    enabled: !!id,
    staleTime: 15 * 1000,
  })
  return { marbete: data ?? null, isLoading, error, refetch }
}

export function useMarbeteMutations(category: PartCategory) {
  const queryClient = useQueryClient()
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['marbetes', category] })
    queryClient.invalidateQueries({ queryKey: ['parts', category] })
  }

  const create = useMutation({
    mutationFn: marbeteService.createMarbete,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof marbeteService.updateMarbete>[1] }) =>
      marbeteService.updateMarbete(id, data),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['marbete'] })
    },
  })

  const remove = useMutation({
    mutationFn: (id: number) => marbeteService.deleteMarbete(id),
    onSuccess: invalidate,
  })

  const addParts = useMutation({
    mutationFn: ({ marbeteId, parts }: { marbeteId: number; parts: PartInput[] }) =>
      marbeteService.addPartsToMarbete(marbeteId, parts),
    onSuccess: () => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['marbete'] })
    },
  })

  return { create, update, remove, addParts }
}
