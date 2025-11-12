import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Tipar a resposta usando Zod para garantir consistência e evitar `any`
const leadSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  phone: z.string().nullable(),
  mail: z.string().nullable(),
  instagram: z.string().nullable(),
  remote_jid: z.string().nullable(),
  created_at: z.date(),
  hasInbound: z.boolean(),
  hasSales: z.boolean(),
  hasAudit: z.boolean(),
  hasMessages: z.boolean(),
})

const leadsResponseSchema = z.object({
  items: z.array(leadSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
})

type LeadPayload = z.infer<typeof leadsResponseSchema>

// Simple in-memory cache to reduce repeated hits from the client in dev
const cache = new Map<string, { ts: number; data: LeadPayload }>()
const CACHE_TTL_MS = 3000 // 3s is enough to cut duplicate refetches in dev

// Prevent concurrent requests from exhausting the connection pool
let running = false
const waitQueue: Array<() => void> = []
async function serialize<T>(fn: () => Promise<T>): Promise<T> {
  if (running) await new Promise<void>((resolve) => waitQueue.push(resolve))
  running = true
  try {
    return await fn()
  } finally {
    running = false
    const next = waitQueue.shift()
    if (next) next()
  }
}

const DATE_RANGE_PRESETS = [
  '1d',
  '3d',
  '7d',
  '14d',
  '30d',
  'thisMonth',
  'lastMonth',
] as const

type DateRangePreset = (typeof DATE_RANGE_PRESETS)[number]

function isDateRangePreset(value: string | null): value is DateRangePreset {
  return Boolean(value && DATE_RANGE_PRESETS.includes(value as DateRangePreset))
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function resolveDateRange(preset: DateRangePreset): { gte: Date; lte: Date } {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  if (preset.endsWith('d')) {
    const days = Number.parseInt(preset.replace('d', ''), 10)
    const from = new Date(todayStart)
    from.setDate(from.getDate() - (days - 1))
    return { gte: from, lte: todayEnd }
  }

  if (preset === 'thisMonth') {
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return { gte: monthStart, lte: todayEnd }
  }

  // lastMonth
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1)
  prevMonthEnd.setMilliseconds(prevMonthEnd.getMilliseconds() - 1)

  return { gte: prevMonthStart, lte: prevMonthEnd }
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.max(
    1,
    Math.min(100, Number.parseInt(searchParams.get('pageSize') || '20', 10) || 20)
  )

  const dateRangeValue = searchParams.get('dateRange')
  const dateRangePreset = isDateRangePreset(dateRangeValue) ? (dateRangeValue as DateRangePreset) : undefined
  const hasInboundFilter = parseBooleanParam(searchParams.get('hasInbound'))
  const hasSalesFilter = parseBooleanParam(searchParams.get('hasSales'))
  const hasMessagesFilter = parseBooleanParam(
    searchParams.get('hasMessages') ?? searchParams.get('hasMessage')
  )
  const hasAuditFilter = parseBooleanParam(searchParams.get('hasAudit'))

  const ors: Prisma.leadsWhereInput[] = []
  if (q) {
    const imode = 'insensitive' as Prisma.QueryMode
    ors.push({ name: { contains: q, mode: imode } })
    ors.push({ phone: { contains: q, mode: imode } })
    ors.push({ mail: { contains: q, mode: imode } })
    ors.push({ instagram: { contains: q, mode: imode } })
    ors.push({ remote_jid: { contains: q, mode: imode } })
    const looksLikeUuid = /^[0-9a-fA-F-]{32,36}$/.test(q)
    if (looksLikeUuid) ors.push({ id: q })
  }

  const filterConditions: Prisma.leadsWhereInput[] = []
  if (ors.length) {
    filterConditions.push({ OR: ors })
  }

  if (dateRangePreset) {
    const range = resolveDateRange(dateRangePreset)
    filterConditions.push({ created_at: { gte: range.gte, lte: range.lte } })
  }

  if (hasInboundFilter !== undefined) {
    filterConditions.push(
      hasInboundFilter ? { inbounds: { some: {} } } : { inbounds: { none: {} } }
    )
  }

  if (hasSalesFilter !== undefined) {
    filterConditions.push(
      hasSalesFilter
        ? { inbounds: { some: { sales: { some: {} } } } }
        : { inbounds: { none: { sales: { some: {} } } } }
    )
  }

  if (hasMessagesFilter !== undefined) {
    filterConditions.push(
      hasMessagesFilter
        ? { lead_messages: { some: {} } }
        : { lead_messages: { none: {} } }
    )
  }

  if (hasAuditFilter !== undefined) {
    filterConditions.push(
      hasAuditFilter
        ? { sales_analytics: { some: {} } }
        : { sales_analytics: { none: {} } }
    )
  }

  let where: Prisma.leadsWhereInput = {}
  if (filterConditions.length === 1) {
    where = filterConditions[0]
  } else if (filterConditions.length > 1) {
    where = { AND: filterConditions }
  }

  try {
    console.log('[api/leads] params', {
      q,
      page,
      pageSize,
      dateRange: dateRangePreset,
      hasInbound: hasInboundFilter,
      hasSales: hasSalesFilter,
      hasMessages: hasMessagesFilter,
      hasAudit: hasAuditFilter,
    })
    console.log('[api/leads] where', JSON.stringify(where))

    const cacheKey = JSON.stringify({ q, page, pageSize, where })
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      console.log('[api/leads] cache hit')
      return NextResponse.json(cached.data)
    }

    console.time('[api/leads] query')

    // ⚠️ Evita uso de $transaction (abre múltiplas conexões)
    const [items, total] = await serialize(async () => {
      const leads = await prisma.leads.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          phone: true,
          mail: true,
          instagram: true,
          remote_jid: true,
          created_at: true,
          _count: {
            select: {
              inbounds: true,
              sales_analytics: true,
              lead_messages: true,
            },
          },
          inbounds: {
            select: {
              id: true,
              _count: {
                select: {
                  sales: true,
                },
              },
            },
          },
        },
      })

      const total = await prisma.leads.count({ where })

      const items = leads.map((lead) => ({
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        mail: lead.mail,
        instagram: lead.instagram,
        remote_jid: lead.remote_jid,
        created_at: lead.created_at,
        hasInbound: lead._count.inbounds > 0,
        hasSales: lead.inbounds.some((inbound) => inbound._count.sales > 0),
        hasAudit: lead._count.sales_analytics > 0,
        hasMessages: lead._count.lead_messages > 0,
      }))

      return [items, total] as const
    })

    console.timeEnd('[api/leads] query')
    console.log('[api/leads] result', { total, itemsLen: items.length })

    const payload = leadsResponseSchema.parse({ items, total, page, pageSize })
    cache.set(cacheKey, { ts: Date.now(), data: payload })

    return NextResponse.json(payload)
  } catch (error) {
    console.error('[api/leads] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads', details: String(error) },
      { status: 500 }
    )
  }
}
