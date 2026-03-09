import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
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

function buildEmailHtml(params: {
  listingTitle: string
  institutionName: string
  city: string
  address: string
  contactName: string
  contactEmail: string
  contactPhone?: string
  totalSuggested: number
  items: Array<{
    typeName: string
    weightKg: number
    volumeM3: number
    quality?: string | null
    suggestedPrice: number
    customPrice?: number | null
  }>
  buyerName: string
  message?: string
}): string {
  const fmt = (n: number) =>
    n.toLocaleString('es-PA', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })

  const rows = params.items
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-size:14px;">${item.typeName}</td>
        <td style="padding:10px 12px;font-size:14px;text-align:center;">${item.weightKg.toFixed(1)} kg</td>
        <td style="padding:10px 12px;font-size:14px;text-align:center;">${item.volumeM3.toFixed(2)} m³</td>
        <td style="padding:10px 12px;font-size:14px;text-align:center;">${item.quality ?? '—'}</td>
        <td style="padding:10px 12px;font-size:14px;text-align:right;font-weight:600;color:#16a34a;">
          ${fmt(item.customPrice ?? item.suggestedPrice)}
        </td>
      </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 36px;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
          Oferta de Venta de Chatarra
        </h1>
        <p style="margin:8px 0 0;color:#fca5a5;font-size:14px;">
          Sistema Nacional de Residuos y Chatarra — Panamá
        </p>
      </td>
    </tr>
    <!-- Greeting -->
    <tr>
      <td style="padding:28px 36px 0;">
        <p style="margin:0;font-size:16px;color:#1e293b;">
          Estimado/a <strong>${params.buyerName}</strong>,
        </p>
        <p style="margin:12px 0 0;font-size:15px;color:#475569;line-height:1.6;">
          Se le contacta en nombre de <strong>${params.institutionName}</strong> para compartir
          una oferta de venta de materiales de chatarra disponibles en nuestra institución.
        </p>
        ${params.message ? `<p style="margin:12px 0 0;padding:16px;background:#f1f5f9;border-left:4px solid #dc2626;border-radius:0 8px 8px 0;font-size:14px;color:#334155;line-height:1.6;">${params.message}</p>` : ''}
      </td>
    </tr>
    <!-- Institution info -->
    <tr>
      <td style="padding:20px 36px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Institución</p>
              <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1e293b;">${params.institutionName}</p>
            </td>
            <td style="padding:16px 20px;">
              <p style="margin:0;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;">Ubicación</p>
              <p style="margin:4px 0 0;font-size:15px;color:#334155;">${params.city}</p>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0 20px 16px;">
              <p style="margin:0;font-size:13px;color:#64748b;">${params.address}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <!-- Items table -->
    <tr>
      <td style="padding:24px 36px 0;">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">
          Materiales Disponibles
        </h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Tipo</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Peso</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Volumen</th>
              <th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Calidad</th>
              <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;">Precio</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#fef2f2;">
              <td colspan="4" style="padding:12px;font-size:15px;font-weight:700;color:#dc2626;">Total Estimado</td>
              <td style="padding:12px;text-align:right;font-size:16px;font-weight:800;color:#dc2626;">${fmt(params.totalSuggested)}</td>
            </tr>
          </tfoot>
        </table>
      </td>
    </tr>
    <!-- Contact -->
    <tr>
      <td style="padding:24px 36px;">
        <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1e293b;">Contacto del Vendedor</h2>
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#475569;padding-right:16px;">Nombre:</td>
            <td style="padding:4px 0;font-size:14px;font-weight:600;color:#1e293b;">${params.contactName}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#475569;padding-right:16px;">Email:</td>
            <td style="padding:4px 0;font-size:14px;"><a href="mailto:${params.contactEmail}" style="color:#dc2626;">${params.contactEmail}</a></td>
          </tr>
          ${params.contactPhone ? `<tr><td style="padding:4px 0;font-size:14px;color:#475569;padding-right:16px;">Teléfono:</td><td style="padding:4px 0;font-size:14px;color:#1e293b;">${params.contactPhone}</td></tr>` : ''}
        </table>
        <a href="mailto:${params.contactEmail}?subject=Interés en oferta: ${encodeURIComponent(params.listingTitle)}"
           style="display:inline-block;margin-top:16px;padding:12px 28px;background:#dc2626;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;">
          Responder al Vendedor
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:20px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;">
        <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
          Este mensaje fue generado por el Sistema Nacional de Residuos y Chatarra de Panamá.<br>
          Si no esperaba este mensaje, puede ignorarlo.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const cookieStore = await cookies()
    const supabase = createSupabase(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await request.json()
    const { buyer_name, buyer_email, buyer_phone, message } = body

    if (!buyer_name || !buyer_email) {
      return NextResponse.json(
        { error: 'buyer_name y buyer_email son requeridos' },
        { status: 400 }
      )
    }

    // Load listing with full details
    const listing = await salesService.getListingById(parseInt(id))
    if (!listing) {
      return NextResponse.json({ error: 'Listado no encontrado' }, { status: 404 })
    }

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY
    if (!resendApiKey) {
      // Gracefully degrade: record inquiry but skip actual email
      console.warn('RESEND_API_KEY not configured — email not sent')
    } else {
      const resend = new Resend(resendApiKey)
      const items = (listing.items ?? []).map((item) => ({
        typeName: item.waste_type?.nombre ?? 'Sin tipo',
        weightKg: item.weight_kg,
        volumeM3: item.volume_m3,
        quality: item.quality,
        suggestedPrice: item.suggested_price,
        customPrice: item.custom_price,
      }))

      const html = buildEmailHtml({
        listingTitle: listing.title,
        institutionName: listing.location?.nombre_institucion ?? 'Institución',
        city: listing.location?.ciudad ?? '',
        address: listing.location?.direccion ?? '',
        contactName: listing.contact_name ?? listing.location?.nombre_responsable ?? '',
        contactEmail: listing.contact_email ?? listing.location?.email_responsable ?? '',
        contactPhone: listing.contact_phone ?? listing.location?.telefono_responsable,
        totalSuggested: listing.total_suggested_price,
        items,
        buyerName: buyer_name,
        message,
      })

      const { error: emailError } = await resend.emails.send({
        from: 'Sistema Chatarra Panamá <noreply@residuos.pa>',
        to: [buyer_email],
        subject: `Oferta de Chatarra: ${listing.title}`,
        html,
      })

      if (emailError) {
        console.error('Resend error:', emailError)
        return NextResponse.json(
          { error: 'Error al enviar correo' },
          { status: 500 }
        )
      }
    }

    // Record inquiry in DB
    await salesService.createInquiry({
      sale_listing_id: parseInt(id),
      buyer_name,
      buyer_email,
      buyer_phone,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
