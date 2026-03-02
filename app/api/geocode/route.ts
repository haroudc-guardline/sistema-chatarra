import { NextRequest, NextResponse } from 'next/server'
import { geocodingService } from '@/lib/services/geocoding-service'

export async function POST(request: NextRequest) {
  try {
    const { address, lat, lng } = await request.json()

    if (address) {
      // Geocode address to coordinates
      const result = await geocodingService.geocodeAddress(address)
      return NextResponse.json(result)
    } else if (lat && lng) {
      // Reverse geocode coordinates to address
      const result = await geocodingService.reverseGeocode(lat, lng)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: 'Please provide either address or lat/lng' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Geocoding failed' },
      { status: 500 }
    )
  }
}
