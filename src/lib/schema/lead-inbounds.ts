import { z } from 'zod'

export const inboundSchema = z.object({
  id: z.string(),
  status: z.string().nullable(),
  pipefy_id: z.string().nullable(),
  gclid: z.string().nullable(),
  fbclid: z.string().nullable(),
  ctwaclid: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  utm_term: z.string().nullable(),
  utm_content: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  pipefy_url: z.string().url().nullable(),
})

export const inboundStatusSummarySchema = z.object({
  status: z.string().nullable(),
  count: z.number().int().nonnegative(),
})

export const inboundChannelSummarySchema = z.object({
  source: z.string().nullable(),
  medium: z.string().nullable(),
  count: z.number().int().nonnegative(),
})

export const leadInboundsResponseSchema = z.object({
  lead: z.object({
    id: z.string(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    created_at: z.string(),
  }),
  totals: z.object({
    inbounds: z.number().int().nonnegative(),
    byStatus: z.array(inboundStatusSummarySchema),
    byChannel: z.array(inboundChannelSummarySchema),
  }),
  inbounds: z.array(inboundSchema),
})

export type LeadInboundsResponse = z.infer<typeof leadInboundsResponseSchema>
export type LeadInbound = z.infer<typeof inboundSchema>
export type LeadInboundStatusSummary = z.infer<typeof inboundStatusSummarySchema>
export type LeadInboundChannelSummary = z.infer<typeof inboundChannelSummarySchema>

export const saleServiceSchema = z.object({
  name: z.string().nullable(),
  quantity: z.number().nullable(),
  price: z.number().nullable(),
})

export const saleInboundSummarySchema = z.object({
  id: z.string(),
  pipefy_id: z.string().nullable(),
  pipefy_url: z.string().url().nullable(),
  status: z.string().nullable(),
  utm_source: z.string().nullable(),
  utm_medium: z.string().nullable(),
  utm_campaign: z.string().nullable(),
  created_at: z.string(),
})

export const saleSchema = z.object({
  id: z.string(),
  amount: z.number().nullable(),
  service_count: z.number().int().nullable(),
  fbtrace_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  services: z.array(saleServiceSchema),
  raw_description: z.unknown().nullable(),
  inbound: saleInboundSummarySchema.nullable(),
})

export const leadSalesResponseSchema = z.object({
  lead: z.object({
    id: z.string(),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    created_at: z.string(),
  }),
  totals: z.object({
    sales: z.number().int().nonnegative(),
    totalAmount: z.number(),
  }),
  sales: z.array(saleSchema),
})

export type LeadSaleService = z.infer<typeof saleServiceSchema>
export type LeadSaleInboundSummary = z.infer<typeof saleInboundSummarySchema>
export type LeadSale = z.infer<typeof saleSchema>
export type LeadSalesResponse = z.infer<typeof leadSalesResponseSchema>
