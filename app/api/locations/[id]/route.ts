import { NextRequest, NextResponse } from 'next/server'
import { locationService } from '@/lib/services/location-service'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    const location = await locationService.getLocationById(parseInt(params.id))
    return NextResponse.json({ data: location })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const body = await request.json()
    const location = await locationService.updateLocation(parseInt(params.id), body)
    return NextResponse.json({ data: location })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    await locationService.deleteLocation(parseInt(params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
