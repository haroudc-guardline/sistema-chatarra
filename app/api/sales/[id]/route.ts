import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { salesService } from '@/lib/services/sales-service'

type RouteContext = { params: Promise<{ id: string }> }

function createSupabase(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const supabase = createSupabase(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const data = await salesService.getListingById(parseInt(id))
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching listing:', error)
    return NextResponse.json({ error: 'Error al obtener listado' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const supabase = createSupabase(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { status } = body

    if (!['draft', 'active', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
    }

    const data = await salesService.updateListingStatus(parseInt(id), status)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error updating listing:', error)
    return NextResponse.json({ error: 'Error al actualizar listado' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const supabase = createSupabase(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    await salesService.deleteListing(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting listing:', error)
    return NextResponse.json({ error: 'Error al eliminar listado' }, { status: 500 })
  }
}
