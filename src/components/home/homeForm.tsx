"use client";
import { useState, useMemo, useEffect } from "react";
import { useSearchParamsClient } from '@/lib/hooks/useSearchParamsClient';
import { WhatsAppDialog } from '@/components/home/buttons/WhatsAppDialog';
import { ActionButtons } from '@/components/home/buttons/ActionButtons';
import { buttonItems } from '@/config/home';
import { contactSchema } from '@/lib/schema/contact';
import { applyWhatsAppMask, removeWhatsAppMask } from '@/lib/masks/phone';
import { sendContactWebhook, type TrackingPayload } from '@/lib/helpers/sendWebhook';
import { toast } from 'sonner';

const KNOWN_SOURCES = [
  { match: ['instagram.com'], label: 'instagram' },
  { match: ['facebook.com', 'm.facebook.com', 'fb.com'], label: 'facebook' },
  { match: ['tiktok.com'], label: 'tiktok' },
  { match: ['linkedin.com'], label: 'linkedin' },
  { match: ['youtube.com'], label: 'youtube' },
  { match: ['x.com', 'twitter.com'], label: 'twitter' },
  { match: ['google.com', 'google.'], label: 'google' }
];

function detectTrafficSource(referrer: string | null): string {
  if (!referrer) return 'direct';
  const ref = referrer.toLowerCase();
  const source = KNOWN_SOURCES.find(s => s.match.some(m => ref.includes(m)));
  return source ? source.label : 'other';
}



export function HomeForm() {
  const searchParams = useSearchParamsClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [trafficSource, setTrafficSource] = useState("unknown");
  const [utmData, setUtmData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const whatsappButton = useMemo(() => buttonItems[0], []);
  const secondaryButtons = useMemo(() => buttonItems.slice(1), []);

  useEffect(() => {
    setUtmData(searchParams);
    setTrafficSource(detectTrafficSource(document.referrer));
  }, [searchParams]);

  async function handleSubmit() {
    const validation = contactSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    const tracking: TrackingPayload = {
      trafficSource,
      utm_source: utmData['utm_source'] ?? trafficSource,
      utm_medium: utmData['utm_medium'] ?? 'organic',
      utm_campaign: utmData['utm_campaign'] ?? 'link-bio',
      utm_content: utmData['utm_content'] ?? 'button-whatsapp',
      fbclid: utmData['fbclid'] ?? null,
      gclid: utmData['gclid'] ?? null,
    };

    try {
      await sendContactWebhook({
        body: {
          name: formData.name,
          phone: removeWhatsAppMask(formData.phone),
          createdAt: new Date().toISOString(),
          tracking,
        },
      });

      setIsDialogOpen(false);
      setFormData({ name: "", phone: "" });
      toast.success("Recebemos sua solicitação! Em breve um especialista entrará em contato.");
    } catch (e) {
      console.warn("Erro ao enviar", e);
      toast.error("Não foi possível enviar sua solicitação. Tente novamente em instantes.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-6 max-w-[500px]">
      <WhatsAppDialog
        label={whatsappButton.label}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        formData={formData}
        errors={errors}
        onNameChange={(v) => setFormData({ ...formData, name: v })}
        onPhoneChange={(e) => setFormData({ ...formData, phone: applyWhatsAppMask(e.target.value) })}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
      <ActionButtons items={secondaryButtons} />
    </div>
  );
}
