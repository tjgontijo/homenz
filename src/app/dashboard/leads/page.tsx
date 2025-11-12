
'use client';

import { Suspense } from 'react';

import ClientLeadsTable from '@/components/dashboard/leads/client-leads-table';
import { NewLeadDialog } from '@/components/dashboard/leads/new-lead_dialog';

export default function LeadsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Comercial HomenZ</h1>
        <NewLeadDialog />
      </div>

      <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando dados...</div>}>
        <ClientLeadsTable />
      </Suspense>
    </div>
  );
}