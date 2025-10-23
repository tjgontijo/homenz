import { Suspense } from 'react';
import HomeContent from '@/components/home/homeContent';

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-b from-[#0a1427] to-[#112240]" />}>
      <HomeContent />
    </Suspense>
  );
}
