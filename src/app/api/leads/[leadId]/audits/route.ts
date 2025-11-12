import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { leadAuditResponseSchema, type LeadAuditResponse } from '@/lib/schema/lead-audit'

const paramsSchema = z.object({
  leadId: z.string().uuid(),
})

export async function GET(_req: Request, context: { params: Promise<{ leadId: string }> }) {
  try {
    const params = await context.params
    const parsed = paramsSchema.safeParse(params)

    if (!parsed.success) {
      return NextResponse.json({ error: 'leadId inválido' }, { status: 400 })
    }

    const { leadId } = parsed.data

    const leadRecord = await prisma.leads.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        phone: true,
        created_at: true,
      },
    })

    if (!leadRecord) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    const audits = await prisma.sales_analytics.findMany({
      where: { lead_id: leadId },
      orderBy: [{ created_at: 'asc' }],
    })

    const payload: LeadAuditResponse = {
      lead: {
        id: leadRecord.id,
        name: leadRecord.name,
        phone: leadRecord.phone,
        created_at: leadRecord.created_at.toISOString(),
      },
      audits: audits.map((audit) => ({
        id: audit.id,
        lead_id: audit.lead_id ?? '',
        qualy_audit: audit.qualy_audit,
        time_audit: audit.time_audit,
        created_at: audit.created_at.toISOString(),
        updated_at: audit.updated_at.toISOString(),
      })),
    }

    const validatedPayload = leadAuditResponseSchema.parse(payload)

    return NextResponse.json(validatedPayload)
  } catch (error) {
    console.error('[api/leads/[leadId]/audits] GET error:', error)
    return NextResponse.json({ error: 'Não foi possível carregar a auditoria' }, { status: 500 })
  }
}
