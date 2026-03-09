'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { locationService } from '@/lib/services/location-service'
import type { Location, LocationWithDetails, WasteType } from '@/types/database'

interface LocationFilters {
  ciudad?: string
  municipio?: string
  corregimiento?: string
  search?: string
  wasteTypeIds?: number[]
}

export function useLocations(filters?: LocationFilters) {
  const queryClient = useQueryClient()

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations', filters],
    queryFn: () => locationService.getLocations(filters),
  })

  const { data: wasteTypes } = useQuery({
    queryKey: ['wasteTypes'],
    queryFn: () => locationService.getWasteTypes(),
  })

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: () => locationService.getCities(),
    staleTime: 24 * 60 * 60 * 1000, // 24h — geography data rarely changes
    gcTime: 24 * 60 * 60 * 1000,
  })

  const createMutation = useMutation({
    mutationFn: (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) =>
      locationService.createLocation(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Location> }) =>
      locationService.updateLocation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => locationService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })

  const createWasteTypeMutation = useMutation({
    mutationFn: (name: string) => locationService.createWasteType(name),
    onSuccess: (newWasteType) => {
      // Invalidate and refetch the waste types list
      queryClient.invalidateQueries({ queryKey: ['wasteTypes'] })
      // Optionally, you can manually update the cache to be faster
      queryClient.setQueryData(['wasteTypes'], (oldData: WasteType[] | undefined) => 
        oldData ? [...oldData, newWasteType] : [newWasteType]
      )
    },
  })

  return {
    locations,
    wasteTypes,
    cities,
    isLoading,
    error,
    createLocation: createMutation.mutateAsync,
    updateLocation: updateMutation.mutateAsync,
    deleteLocation: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createWasteType: createWasteTypeMutation.mutateAsync,
    isCreatingWasteType: createWasteTypeMutation.isPending,
  }
}

export function useLocation(id: number) {
  const queryClient = useQueryClient()

  const { data: location, isLoading, error } = useQuery({
    queryKey: ['location', id],
    queryFn: () => locationService.getLocationById(id),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<Location>) =>
      locationService.updateLocation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['location', id] })
      queryClient.invalidateQueries({ queryKey: ['locations'] })
    },
  })

  return {
    location,
    isLoading,
    error,
    updateLocation: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
