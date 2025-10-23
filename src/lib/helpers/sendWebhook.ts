export interface TrackingPayload {
  trafficSource: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  fbclid: string | null;
  gclid: string | null;
}

export interface ContactWebhookPayload {
  body: {
    name: string;
    phone: string;
    createdAt: string;
    tracking: TrackingPayload;
  };
}

export async function sendContactWebhook(payload: ContactWebhookPayload): Promise<void> {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Erro ao enviar (${response.status})`);
  }
}
