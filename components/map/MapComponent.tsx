'use client'

import { useEffect, useState, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api'
import type { LocationWithDetails } from '@/types/database'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter = {
  lat: 8.538,
  lng: -80.782, // Center of Panama
}

interface MapComponentProps {
  locations: LocationWithDetails[]
  selectedLocation?: LocationWithDetails | null
  onMarkerClick?: (location: LocationWithDetails) => void
  onMapClick?: (e: google.maps.MapMouseEvent) => void
  interactive?: boolean
  height?: string
}

export function MapComponent({
  locations,
  selectedLocation,
  onMarkerClick,
  onMapClick,
  interactive = true,
  height = '100%',
}: MapComponentProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [activeMarker, setActiveMarker] = useState<number | null>(null)

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Fit bounds to show all markers
  useEffect(() => {
    if (map && locations.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      locations.forEach((location) => {
        bounds.extend({
          lat: location.latitud,
          lng: location.longitud,
        })
      })
      map.fitBounds(bounds)

      // If only one location, zoom in more
      if (locations.length === 1) {
        map.setZoom(15)
      }
    }
  }, [map, locations])

  const handleMarkerClick = (location: LocationWithDetails) => {
    setActiveMarker(location.id)
    onMarkerClick?.(location)
  }

  if (loadError) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center p-6">
          <p className="text-red-600 font-medium">Error al cargar el mapa</p>
          <p className="text-slate-500 text-sm mt-1">
            Por favor verifica tu conexión e intenta nuevamente
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-100 rounded-lg">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto" />
          <p className="text-slate-500 mt-2">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      <GoogleMap
        mapContainerStyle={{ ...mapContainerStyle, height }}
        center={defaultCenter}
        zoom={7}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          fullscreenControl: true,
          clickableIcons: interactive,
        }}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={{
              lat: location.latitud,
              lng: location.longitud,
            }}
            onClick={() => handleMarkerClick(location)}
            icon={{
              url: activeMarker === location.id
                ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            }}
          >
            {activeMarker === location.id && (
              <InfoWindow
                position={{
                  lat: location.latitud,
                  lng: location.longitud,
                }}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-slate-900">
                    {location.nombre_institucion}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {location.direccion}
                  </p>
                  {location.waste_types && location.waste_types.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-500 font-medium mb-1">
                        Tipos de residuos:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {location.waste_types.slice(0, 3).map((wt) => (
                          <span
                            key={wt.id}
                            className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded"
                          >
                            {wt.nombre}
                          </span>
                        ))}
                        {location.waste_types.length > 3 && (
                          <span className="text-xs text-slate-500">
                            +{location.waste_types.length - 3} más
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <a
                    href={`/locations/${location.id}`}
                    className="text-emerald-600 text-sm hover:underline mt-2 inline-block"
                  >
                    Ver detalles →
                  </a>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {selectedLocation && (
          <Marker
            position={{
              lat: selectedLocation.latitud,
              lng: selectedLocation.longitud,
            }}
            icon={{
              url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}
