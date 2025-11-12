import { NextResponse } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import {
  leadMessagesResponseSchema,
  type LeadMessage,
  type LeadMessagesResponse,
} from '@/lib/schema/lead-messages'

const paramsSchema = z.object({
  leadId: z.string().uuid(),
})

const FALLBACK_AUTHOR_ROLE = 'team' satisfies LeadMessage['author']['role']

function normalizeRole(role: string | null | undefined): LeadMessage['author']['role'] {
  if (!role) return FALLBACK_AUTHOR_ROLE
  const normalized = role.toLowerCase()
  if (normalized === 'lead' || normalized === 'team' || normalized === 'bot') {
    return normalized
  }
  return FALLBACK_AUTHOR_ROLE
}

export async function GET(_req: Request, context: { params: Promise<{ leadId: string }> }) {
  try {
    const params = await context.params
    const parse = paramsSchema.safeParse(params)
    if (!parse.success) {
      return NextResponse.json({ error: 'leadId inválido' }, { status: 400 })
    }

    const { leadId } = parse.data

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

    const messagesRecords = await prisma.lead_messages.findMany({
      where: { lead_id: leadId },
      orderBy: [{ sent_at: 'asc' }, { created_at: 'asc' }],
    })

    const payload: LeadMessagesResponse = {
      lead: {
        id: leadRecord.id,
        name: leadRecord.name,
        phone: leadRecord.phone,
        created_at: leadRecord.created_at.toISOString(),
      },
      messages: messagesRecords.map((message) => ({
        id: message.id,
        message_id: message.message_id,
        lead_id: message.lead_id,
        type: message.message_type,
        body: typeof message.body === 'string' ? message.body : null,
        raw_payload: message.raw_payload ?? null,
        sent_at: message.sent_at ? message.sent_at.toISOString() : null,
        author: {
          number: message.author_number ?? null,
          role: normalizeRole(message.author_role),
        },
      })),
    }

    const validatedPayload = leadMessagesResponseSchema.parse(payload)

    return NextResponse.json(validatedPayload)
  } catch (error) {
    console.error('[api/leads/[leadId]/messages] GET error:', error)
    return NextResponse.json({ error: 'Não foi possível carregar as mensagens' }, { status: 500 })
  }
}
