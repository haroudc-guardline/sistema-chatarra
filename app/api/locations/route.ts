import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/lib/services/location-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      ciudad: searchParams.get('ciudad') || undefined,
      municipio: searchParams.get('municipio') || undefined,
      corregimiento: searchParams.get('corregimiento') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const locations = await locationService.getLocations(filters)
    return NextResponse.json({ data: locations })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const location = await locationService.createLocation(body)
    return NextResponse.json({ data: location }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
