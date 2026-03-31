'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  stockItemService,
  type VehicleSearchFilters,
  type AcUnitSearchFilters,
  type ToolSearchFilters,
} from '@/lib/services/stock-item-service'

export function useVehicleSearch(filters: VehicleSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockVehicles', filters],
    queryFn: () => stockItemService.searchVehicles(filters),
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

export function useAcUnitSearch(filters: AcUnitSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockAcUnits', filters],
    queryFn: () => stockItemService.searchAcUnits(filters),
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

export function useToolSearch(filters: ToolSearchFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stockTools', filters],
    queryFn: () => stockItemService.searchTools(filters),
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

export function useVehicleMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stockVehicles'] })

  const create = useMutation({
    mutationFn: stockItemService.createVehicle,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof stockItemService.updateVehicle>[1] }) =>
      stockItemService.updateVehicle(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: stockItemService.deleteVehicle,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function useAcUnitMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stockAcUnits'] })

  const create = useMutation({
    mutationFn: stockItemService.createAcUnit,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof stockItemService.updateAcUnit>[1] }) =>
      stockItemService.updateAcUnit(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: stockItemService.deleteAcUnit,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}

export function useToolMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['stockTools'] })

  const create = useMutation({
    mutationFn: stockItemService.createTool,
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof stockItemService.updateTool>[1] }) =>
      stockItemService.updateTool(id, data),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: stockItemService.deleteTool,
    onSuccess: invalidate,
  })

  return { create, update, remove }
}
