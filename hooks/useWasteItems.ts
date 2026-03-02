'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import type { WasteItem } from '@/types/database'

export function useWasteItems(locationId: number) {
  const { user } = useAuth()
  const [wasteItems, setWasteItems] = useState<WasteItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchWasteItems = useCallback(async () => {
    if (!locationId) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/locations/${locationId}/waste-items`)
      if (!response.ok) throw new Error('Failed to fetch waste items')
      const data = await response.json()
      setWasteItems(data)
    } catch (error) {
      console.error('Error fetching waste items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [locationId])

  const createWasteItem = useCallback(async (wasteItemData: Partial<WasteItem>) => {
    if (!locationId || !user) return

    setIsCreating(true)
    try {
      const response = await fetch(`/api/locations/${locationId}/waste-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wasteItemData),
      })
      
      if (!response.ok) throw new Error('Failed to create waste item')
      
      const newItem = await response.json()
      setWasteItems(prev => [...prev, newItem])
      return newItem
    } catch (error) {
      console.error('Error creating waste item:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [locationId, user])

  const updateWasteItem = useCallback(async (id: number, updates: Partial<WasteItem>) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/locations/${locationId}/waste-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (!response.ok) throw new Error('Failed to update waste item')
      
      const updatedItem = await response.json()
      setWasteItems(prev => prev.map(item => item.id === id ? updatedItem : item))
      return updatedItem
    } catch (error) {
      console.error('Error updating waste item:', error)
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [locationId])

  const deleteWasteItem = useCallback(async (id: number) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/locations/${locationId}/waste-items/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete waste item')
      
      setWasteItems(prev => prev.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error deleting waste item:', error)
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [locationId])

  return {
    wasteItems,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    fetchWasteItems,
    createWasteItem,
    updateWasteItem,
    deleteWasteItem,
  }
}
