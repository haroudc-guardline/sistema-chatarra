import { NextRequest, NextResponse } from 'next/server'
import { auditService } from '@/lib/services/audit-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const options = {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
      entityType: searchParams.get('entityType') || undefined,
      action: searchParams.get('action') || undefined,
    }

    const result = await auditService.getAuditLogs(options)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
