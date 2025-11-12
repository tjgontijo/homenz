import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

type SalesRow = {
  id: string;
  inbound_id: string | null;
  fbtrace_id: string | null;
  description: unknown | null; // JSON
  service_count: number | null;
  amount: string | null; // Decimal as string
  created_at?: Date;
};

function parseSqlInsert(content: string): SalesRow[] {
  const compact = content.replace(/\r?\n/g, ' ').trim();
  const tupleMatches = compact.match(/\([^)]*\)/g) ?? [];
  const rows: SalesRow[] = [];

  for (const tuple of tupleMatches) {
    const valueMatches = [...tuple.matchAll(/'([^']*)'|\bnull\b/gi)];
    if (valueMatches.length !== 7) {
      continue;
    }
    const values = valueMatches.map((m) => (m[0].toLowerCase() === 'null' ? null : (m[1] ?? null)));
    const [id, inbound_id, fbtrace_id, descriptionRaw, serviceCountRaw, amountRaw, createdAtRaw] = values;

    let description: unknown | null = null;
    if (typeof descriptionRaw === 'string') {
      try {
        description = JSON.parse(descriptionRaw);
      } catch {
        description = descriptionRaw; // mantém string se não for JSON válido
      }
    }

    const service_count = typeof serviceCountRaw === 'string' ? Number(serviceCountRaw) : null;
    const amount = typeof amountRaw === 'string' ? amountRaw : null;
    let created_at: Date | undefined;
    if (typeof createdAtRaw === 'string') {
      const withT = createdAtRaw.replace(' ', 'T');
      const normalized = withT.replace(/([+-]\d{2})(?!:)/, '$1:00');
      const d = new Date(normalized);
      if (!isNaN(d.getTime())) {
        created_at = d;
      }
    }

    rows.push({
      id: id as string,
      inbound_id: inbound_id as string | null,
      fbtrace_id: fbtrace_id as string | null,
      description,
      service_count,
      amount,
      created_at,
    });
  }
  return rows;
}

export async function seedSales(prisma: PrismaClient) {
  console.log('🌱 Populando sales a partir de SQL...');
  try {
    const sqlPath = path.resolve(process.cwd(), 'bck_database', 'sales_rows.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    // Executa o SQL de backup diretamente para preservar IDs e timestamps
    await prisma.$executeRawUnsafe(content);
    console.log('✅ Vendas inseridas via SQL de backup');
  } catch (error) {
    console.error('❌ Erro ao popular sales:', error);
    throw error;
  }
}