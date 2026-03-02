import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/services/user-service'

type RouteContext = {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: any) {
  try {
    const user = await userService.getUserById(params.id)
    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: any) {
  try {
    const body = await request.json()
    const user = await userService.updateUser(params.id, body)
    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: any) {
  try {
    await userService.deleteUser(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
