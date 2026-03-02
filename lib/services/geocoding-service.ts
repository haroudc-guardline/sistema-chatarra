const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export const geocodingService = {
  // Geocode address to coordinates
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number; formatted_address: string }> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured')
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Geocoding failed: ${data.status}`)
    }

    const result = data.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address
    }
  },

  // Reverse geocode coordinates to address
  async reverseGeocode(lat: number, lng: number): Promise<{ formatted_address: string; address_components: any[] }> {
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured')
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Reverse geocoding failed: ${data.status}`)
    }

    const result = data.results[0]
    return {
      formatted_address: result.formatted_address,
      address_components: result.address_components
    }
  }
}
