import { NextRequest, NextResponse } from 'next/server'
import { userService } from '@/lib/services/user-service'

export async function GET(request: NextRequest) {
  try {
    const users = await userService.getUsers()
    return NextResponse.json({ data: users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, nombre, rol } = await request.json()
    const user = await userService.createUser(email, password, nombre, rol)
    return NextResponse.json({ data: user }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
