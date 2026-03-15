'use client'

import { useQuery } from '@tanstack/react-query'
import { wasteItemService, type WasteItemSearchFilters } from '@/lib/services/waste-item-service'

export function useWasteItemSearch(filters: WasteItemSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wasteItemSearch', filters],
    queryFn: () => wasteItemService.searchWasteItems(filters),
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
