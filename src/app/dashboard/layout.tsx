import Providers from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <Toaster richColors position="bottom-center" />
    </Providers>
  );
}