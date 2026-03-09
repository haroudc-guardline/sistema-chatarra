'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { salesService } from '@/lib/services/sales-service'
import type { SaleListing, SaleInquiry } from '@/types/database'

interface SalesFilters {
  status?: string
  locationId?: number
}

export function useSales(filters?: SalesFilters) {
  const queryClient = useQueryClient()

  const { data: listings, isLoading, error } = useQuery({
    queryKey: ['sales', filters],
    queryFn: () => salesService.getListings(filters),
    staleTime: 30_000, // 30s
    gcTime: 5 * 60_000,
  })

  const { data: marketPrices, isLoading: isLoadingPrices } = useQuery({
    queryKey: ['marketPrices'],
    queryFn: () => salesService.getMarketPrices(),
    staleTime: 5 * 60_000, // 5 min — prices change occasionally
    gcTime: 10 * 60_000,
  })

  const createMutation = useMutation({
    mutationFn: ({
      listing,
      items,
    }: {
      listing: Omit<SaleListing, 'id' | 'created_at' | 'updated_at' | 'total_market_value' | 'total_suggested_price'>
      items: Parameters<typeof salesService.createListing>[1]
    }) => salesService.createListing(listing, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'draft' | 'active' | 'closed' }) =>
      salesService.updateListingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['sale'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => salesService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const updatePriceMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number
      updates: { price_per_kg?: number; price_per_m3?: number; notes?: string }
    }) => salesService.updateMarketPrice(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketPrices'] })
    },
  })

  return {
    listings,
    marketPrices,
    isLoading,
    isLoadingPrices,
    error,
    createListing: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    deleteListing: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    updateMarketPrice: updatePriceMutation.mutateAsync,
    isUpdatingPrice: updatePriceMutation.isPending,
  }
}

export function useSaleListing(id: number) {
  const queryClient = useQueryClient()

  const { data: listing, isLoading, error } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesService.getListingById(id),
    enabled: !!id && !isNaN(id),
  })

  const updateStatusMutation = useMutation({
    mutationFn: (status: 'draft' | 'active' | 'closed') =>
      salesService.updateListingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', id] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })

  const createInquiryMutation = useMutation({
    mutationFn: (inquiry: Omit<SaleInquiry, 'id' | 'created_at' | 'sent_at' | 'status'>) =>
      salesService.createInquiry(inquiry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sale', id] })
    },
  })

  return {
    listing,
    isLoading,
    error,
    updateStatus: updateStatusMutation.mutateAsync,
    isUpdatingStatus: updateStatusMutation.isPending,
    createInquiry: createInquiryMutation.mutateAsync,
    isCreatingInquiry: createInquiryMutation.isPending,
  }
}

export function useLocationWasteItems(locationId: number | null) {
  return useQuery({
    queryKey: ['wasteItems', locationId],
    queryFn: () => salesService.getWasteItemsForLocation(locationId!),
    enabled: !!locationId,
    staleTime: 60_000,
  })
}
