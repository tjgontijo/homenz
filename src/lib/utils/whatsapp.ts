import { normalizeWhatsApp } from "../masks/phone";

export function createWhatsAppUrl(phone: string, message: string): string {
  const normalized = normalizeWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  
  if (typeof navigator === 'undefined') {
    return `https://web.whatsapp.com/send?phone=${normalized}&text=${encoded}`;
  }
  
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
  const base = isMobile ? "https://api.whatsapp.com" : "https://web.whatsapp.com";
  return `${base}/send?phone=${normalized}&text=${encoded}`;
}
