'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  stockExitService,
  type StockExitFilters,
  type StockItemSearchParams,
} from '@/lib/services/stock-exit-service'

export function useStockExitSearch(filters: StockExitFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockExits', filters],
    queryFn: () => stockExitService.searchExits(filters),
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

export function useStockExitMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stockExits'] })

  const create = useMutation({
    mutationFn: stockExitService.createExit,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof stockExitService.updateExit>[1] }) =>
      stockExitService.updateExit(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: stockExitService.deleteExit,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function useStockItemSearch(params: StockItemSearchParams) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockItemSearch', params],
    queryFn: () => stockExitService.searchStockItems(params),
    staleTime: 30 * 1000,
    enabled: !!(params.search || params.category || params.location_id),
  })
  return {
    items: data ?? [],
    isLoading,
    error,
    refetch,
  }
}
