import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import {
  leadSalesResponseSchema,
  type LeadSaleInboundSummary,
  type LeadSaleService,
} from '@/lib/schema/lead-inbounds'

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
      },
    })

    if (!leadRecord) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    const salesRecords = await prisma.sales.findMany({
      where: {
        inbounds: {
          lead_id: leadId,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        amount: true,
        service_count: true,
        fbtrace_id: true,
        description: true,
        created_at: true,
        updated_at: true,
        inbounds: {
          select: {
            id: true,
            pipefy_id: true,
            status: true,
            utm_source: true,
            utm_medium: true,
            utm_campaign: true,
            created_at: true,
          },
        },
      },
    })

    let totalAmount = 0

    const sales = salesRecords.map((sale) => {
      const amountNumber = sale.amount !== null ? Number(sale.amount) : null
      if (amountNumber !== null) {
        totalAmount += amountNumber
      }

      const inboundSummary = sale.inbounds ? buildInboundSummary(sale.inbounds) : null
      const services = normalizeServices(sale.description)

      return {
        id: sale.id,
        amount: amountNumber,
        service_count: sale.service_count,
        fbtrace_id: sale.fbtrace_id,
        created_at: sale.created_at.toISOString(),
        updated_at: sale.updated_at.toISOString(),
        services,
        raw_description: sale.description ?? null,
        inbound: inboundSummary,
      }
    })

    const payload = leadSalesResponseSchema.parse({
      lead: {
        id: leadRecord.id,
        name: leadRecord.name,
        phone: leadRecord.phone,
        created_at: leadRecord.created_at.toISOString(),
      },
      totals: {
        sales: sales.length,
        totalAmount,
      },
      sales,
    })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[api/leads/[leadId]/sales] GET error:', error)
    return NextResponse.json({ error: 'Não foi possível carregar as vendas' }, { status: 500 })
  }
}

function buildInboundSummary(inbound: {
  id: string
  pipefy_id: string | null
  status: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: Date
}): LeadSaleInboundSummary {
  return {
    id: inbound.id,
    pipefy_id: inbound.pipefy_id,
    pipefy_url: inbound.pipefy_id ? `https://app.pipefy.com/open-cards/${inbound.pipefy_id}` : null,
    status: inbound.status,
    utm_source: inbound.utm_source,
    utm_medium: inbound.utm_medium,
    utm_campaign: inbound.utm_campaign,
    created_at: inbound.created_at.toISOString(),
  }
}

function normalizeServices(description: Prisma.JsonValue | null): LeadSaleService[] {
  if (description === null || description === undefined) {
    return []
  }

  const parsed = typeof description === 'string' ? safelyParseJson(description) : description
  const candidates = extractCandidateServices(parsed)

  return candidates
    .map((candidate) => normalizeServiceItem(candidate))
    .filter((service): service is LeadSaleService => Boolean(service))
}

function extractCandidateServices(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value
  }

  if (value && typeof value === 'object') {
    const maybeServices = (value as Record<string, unknown>).services
    if (Array.isArray(maybeServices)) {
      return maybeServices
    }

    const maybeItems = (value as Record<string, unknown>).items
    if (Array.isArray(maybeItems)) {
      return maybeItems
    }
  }

  return []
}

function normalizeServiceItem(item: unknown): LeadSaleService | null {
  if (!item || typeof item !== 'object') {
    return null
  }

  const record = item as Record<string, unknown>

  const nameValue = pickValue(record, [
    'name',
    'title',
    'description',
    'descricao',
    'servico',
    'serviço',
    'produto',
    'product',
  ])
  const quantityValue = pickValue(record, [
    'quantity',
    'qty',
    'qtd',
    'quantidade',
    'qtde',
    'qtdade',
    'amount',
  ])
  const priceValue = pickValue(record, [
    'price',
    'valor',
    'value',
    'total',
    'preco',
    'preço',
  ])

  const name = getString(nameValue)
  const quantity = getNumber(quantityValue)
  const price = getNumber(priceValue)

  if (name === null && quantity === null && price === null) {
    return null
  }

  return {
    name,
    quantity,
    price,
  }
}

function pickValue(record: Record<string, unknown>, keys: string[]): unknown {
  const normalizedEntries = new Map<string, unknown>()

  for (const [key, value] of Object.entries(record)) {
    normalizedEntries.set(normalizeKey(key), value)
  }

  for (const key of keys) {
    const normalizedKey = normalizeKey(key)
    if (normalizedEntries.has(normalizedKey)) {
      return normalizedEntries.get(normalizedKey)
    }
  }

  return undefined
}

function normalizeKey(key: string) {
  return key
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

function getString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }
  return null
}

function getNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const numeric = parseLocaleNumber(value)
    if (Number.isFinite(numeric)) {
      return numeric
    }
  }
  return null
}

function parseLocaleNumber(value: string): number {
  const sanitized = value.replace(/[^0-9,.-]/g, '')

  const needsCommaNormalization = sanitized.includes(',') && sanitized.lastIndexOf(',') >= sanitized.lastIndexOf('.')
  const normalized = needsCommaNormalization
    ? sanitized.replace(/\./g, '').replace(',', '.')
    : sanitized

  return Number(normalized)
}

function safelyParseJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}
