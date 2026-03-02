'use client'

import { useEffect, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin } from 'lucide-react'

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onPlaceSelect: (place: {
    address: string
    lat: number
    lng: number
  }) => void
  placeholder?: string
  disabled?: boolean
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Buscar dirección...',
  disabled = false,
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  
  // Use the same loader as MapComponent
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  useEffect(() => {
    if (!isLoaded || loadError || !inputRef.current || autocompleteRef.current) {
      return
    }

    try {
      // Initialize Google Places Autocomplete
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ['address'], // Only addresses, not businesses
          componentRestrictions: { country: 'pa' }, // Restrict to Panama
          fields: ['formatted_address', 'geometry', 'name'],
        }
      )

      // Listen for place selection
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace()
        
        if (place && place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat()
          const lng = place.geometry.location.lng()
          const address = place.formatted_address || place.name || ''
          
          onChange(address)
          onPlaceSelect({
            address,
            lat,
            lng,
          })
        }
      })
    } catch (err) {
      console.error('Error initializing Places Autocomplete:', err)
    }
  }, [isLoaded, loadError, onChange, onPlaceSelect])

  if (loadError) {
    return (
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Error al cargar Google Maps"
          disabled={true}
          className="pl-10 border-red-300"
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={isLoaded ? placeholder : 'Cargando Google Maps...'}
        disabled={disabled || !isLoaded}
        className="pl-10"
      />
      {!isLoaded && (
        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
      )}
    </div>
  )
}
