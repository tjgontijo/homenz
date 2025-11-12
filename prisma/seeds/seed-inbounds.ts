import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

type InboundRow = {
  id: string;
  lead_id: string | null;
  gclid: string | null;
  fbclid: string | null;
  ctwaclid: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  created_at?: Date;
  pipefy_id: string | null;
  utm_medium: string | null;
  status: string | null;
};

function parseSqlInsert(content: string): InboundRow[] {
  const compact = content.replace(/\r?\n/g, ' ').trim();
  const tupleMatches = compact.match(/\([^)]*\)/g) ?? [];
  const rows: InboundRow[] = [];

  for (const tuple of tupleMatches) {
    const valueMatches = [...tuple.matchAll(/'([^']*)'|\bnull\b/gi)];
    if (valueMatches.length !== 13) {
      continue;
    }
    const values = valueMatches.map((m) => (m[0].toLowerCase() === 'null' ? null : (m[1] ?? null)));
    const [
      id,
      lead_id,
      gclid,
      fbclid,
      ctwaclid,
      utm_source,
      utm_campaign,
      utm_term,
      utm_content,
      createdAtRaw,
      pipefy_id,
      utm_medium,
      status,
    ] = values;

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
      lead_id: lead_id as string | null,
      gclid: gclid as string | null,
      fbclid: fbclid as string | null,
      ctwaclid: ctwaclid as string | null,
      utm_source: utm_source as string | null,
      utm_campaign: utm_campaign as string | null,
      utm_term: utm_term as string | null,
      utm_content: utm_content as string | null,
      created_at,
      pipefy_id: pipefy_id as string | null,
      utm_medium: utm_medium as string | null,
      status: status as string | null,
    });
  }
  return rows;
}

export async function seedInbounds(prisma: PrismaClient) {
  console.log('🌱 Populando inbounds a partir de SQL...');
  try {
    const sqlPath = path.resolve(process.cwd(), 'bck_database', 'inbounds_rows.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    // Executa o SQL de backup diretamente para preservar IDs e timestamps
    await prisma.$executeRawUnsafe(content);
    console.log('✅ Inbounds inseridos via SQL de backup');
  } catch (error) {
    console.error('❌ Erro ao popular inbounds:', error);
    throw error;
  }
}