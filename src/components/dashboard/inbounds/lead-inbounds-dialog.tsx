'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { InboundTimeline } from '@/components/dashboard/inbounds/inbound-timeline'
import { applyWhatsAppMask } from '@/lib/masks/phone'
import {
  LeadInboundsResponse,
  leadInboundsResponseSchema,
} from '@/lib/schema/lead-inbounds'

async function fetchLeadInbounds(leadId: string): Promise<LeadInboundsResponse> {
  const response = await fetch(`/api/leads/${leadId}/inbounds`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Não foi possível carregar os inbounds do lead')
  }

  const json = await response.json()
  return leadInboundsResponseSchema.parse(json)
}

export type LeadInboundsDialogProps = {
  leadId: string
  leadName: string | null
  leadPhone: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadInboundsDialog({
  leadId,
  leadName,
  leadPhone,
  open,
  onOpenChange,
}: LeadInboundsDialogProps) {
  const { data, isLoading, isError, refetch, error } = useQuery({
    queryKey: ['lead-inbounds', leadId],
    queryFn: () => fetchLeadInbounds(leadId),
    enabled: open && Boolean(leadId),
    staleTime: 5_000,
    retry: 1,
  })

  const formattedPhone = useMemo(() => {
    return leadPhone ? applyWhatsAppMask(leadPhone) : '—'
  }, [leadPhone])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-full sm:max-w-none sm:w-[60vw] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle>
            {leadName || 'Lead sem nome'}
          </DialogTitle>
          <DialogDescription>
            Telefone: {formattedPhone}
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando inbounds…
          </div>
        )}

        {isError && !isLoading && (
          <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            <p>{(error as Error | undefined)?.message ?? 'Erro ao carregar dados.'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !isError && data && (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {data.totals.inbounds}
              </span>{' '}
              {data.totals.inbounds === 1
                ? 'inbound registrado para este lead.'
                : 'inbounds registrados para este lead.'}
            </div>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold">Inbounds</h3>
              <InboundTimeline items={data.inbounds} />
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
