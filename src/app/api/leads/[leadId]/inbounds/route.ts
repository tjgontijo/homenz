import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { leadInboundsResponseSchema } from '@/lib/schema/lead-inbounds'

const paramsSchema = z.object({
  leadId: z.string().uuid(),
})

export async function GET(_req: Request, context: { params: Promise<{ leadId: string }> }) {
  try {
    const params = await context.params
    const parseResult = paramsSchema.safeParse(params)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'leadId inválido' }, { status: 400 })
    }

    const { leadId } = parseResult.data

    const leadRecord = await prisma.leads.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        name: true,
        phone: true,
        created_at: true,
        inbounds: {
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            status: true,
            pipefy_id: true,
            gclid: true,
            fbclid: true,
            ctwaclid: true,
            utm_source: true,
            utm_medium: true,
            utm_campaign: true,
            utm_term: true,
            utm_content: true,
            created_at: true,
            updated_at: true,
          },
        },
      },
    })

    if (!leadRecord) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    const statusCounts = new Map<string | null, number>()
    const channelCounts = new Map<string, { source: string | null; medium: string | null; count: number }>()

    const inbounds = leadRecord.inbounds.map((inbound) => {
      const statusKey = inbound.status ?? null
      statusCounts.set(statusKey, (statusCounts.get(statusKey) ?? 0) + 1)

      const channelKey = `${inbound.utm_source ?? ''}|||${inbound.utm_medium ?? ''}`
      const existingChannel = channelCounts.get(channelKey) ?? {
        source: inbound.utm_source ?? null,
        medium: inbound.utm_medium ?? null,
        count: 0,
      }
      existingChannel.count += 1
      channelCounts.set(channelKey, existingChannel)

      return {
        id: inbound.id,
        status: inbound.status,
        pipefy_id: inbound.pipefy_id,
        gclid: inbound.gclid,
        fbclid: inbound.fbclid,
        ctwaclid: inbound.ctwaclid,
        utm_source: inbound.utm_source,
        utm_medium: inbound.utm_medium,
        utm_campaign: inbound.utm_campaign,
        utm_term: inbound.utm_term,
        utm_content: inbound.utm_content,
        created_at: inbound.created_at.toISOString(),
        updated_at: inbound.updated_at.toISOString(),
        pipefy_url: inbound.pipefy_id ? `https://app.pipefy.com/open-cards/${inbound.pipefy_id}` : null,
      }
    })

    const byStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({ status, count }))
    const byChannel = Array.from(channelCounts.values())

    const payload = leadInboundsResponseSchema.parse({
      lead: {
        id: leadRecord.id,
        name: leadRecord.name,
        phone: leadRecord.phone,
        created_at: leadRecord.created_at.toISOString(),
      },
      totals: {
        inbounds: inbounds.length,
        byStatus,
        byChannel,
      },
      inbounds,
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[api/leads/[leadId]/inbounds] GET error:', error)
    return NextResponse.json({ error: 'Não foi possível carregar os inbounds' }, { status: 500 })
  }
}
