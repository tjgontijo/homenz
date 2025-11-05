import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const trackingSchema = z.object({
  trafficSource: z.string().trim().min(1, 'Fonte de tráfego inválida'),
  utm_source: z.string().trim().optional().nullable(),
  utm_medium: z.string().trim().optional().nullable(),
  utm_campaign: z.string().trim().optional().nullable(),
  fbclid: z.string().trim().optional().nullable(),
  gclid: z.string().trim().optional().nullable(),
});

const contactRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Nome inválido'),
    phone: z.string().trim().min(8, 'Telefone inválido'),
    createdAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida'),
    tracking: trackingSchema,
  }),
});

type ContactRequest = z.infer<typeof contactRequestSchema>;

interface WebhookTracking {
  trafficSource: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  fbclid: string | null;
  gclid: string | null;
}

interface WebhookPayload {
  name: string;
  phone: string;
  tracking: WebhookTracking;
  createdAt: string;
}

function normalizeOptionalField(value: string | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildWebhookPayload({ body }: ContactRequest): WebhookPayload {
  const tracking: WebhookTracking = {
    trafficSource: body.tracking.trafficSource,
    utm_source: normalizeOptionalField(body.tracking.utm_source),
    utm_medium: normalizeOptionalField(body.tracking.utm_medium),
    utm_campaign: normalizeOptionalField(body.tracking.utm_campaign),
    fbclid: normalizeOptionalField(body.tracking.fbclid),
    gclid: normalizeOptionalField(body.tracking.gclid),
  };

  return {
    name: body.name,
    phone: body.phone,
    tracking,
    createdAt: body.createdAt,
  };
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const validation = contactRequestSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Payload inválido',
          issues: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const webhookPayload = buildWebhookPayload(validation.data);

    const response = await fetch(
      'https://webhook.elev8.com.br/webhook/e400a55e-a59d-4130-9add-db88cd65bfd1',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(webhookPayload),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erro ao enviar (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro na rota de contato:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
