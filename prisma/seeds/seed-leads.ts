import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

type LeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  remote_jid: string | null;
  created_at?: Date;
  instagram: string | null;
  mail: string | null;
};

function parseSqlInsert(content: string): LeadRow[] {
  // Remove quebras de linha extras para facilitar parsing
  const compact = content.replace(/\r?\n/g, ' ').trim();

  // Extrai todos os grupos entre parênteses, cada um representa uma linha de valores
  const tupleMatches = compact.match(/\([^)]*\)/g) ?? [];
  const rows: LeadRow[] = [];

  for (const tuple of tupleMatches) {
    // Captura valores '...'(strings) ou null
    const valueMatches = [...tuple.matchAll(/'([^']*)'|\bnull\b/gi)];
    if (valueMatches.length !== 7) {
      // Ignora tuplas que não possuem 7 valores
      continue;
    }

    const values = valueMatches.map((m) => {
      // m[0] é o match completo, m[1] é o grupo dentro de aspas quando presente
      if (m[0].toLowerCase() === 'null') return null;
      return m[1] ?? null;
    });

    const [id, name, phone, remote_jid, createdAtRaw, instagram, mail] = values;

    // Normaliza timestamp para formato ISO
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
      name: name as string | null,
      phone: phone as string | null,
      remote_jid: remote_jid as string | null,
      created_at,
      instagram: instagram as string | null,
      mail: mail as string | null,
    });
  }

  return rows;
}

export async function seedLeads(prisma: PrismaClient) {
  console.log('🌱 Populando leads a partir de SQL...');
  try {
    const sqlPath = path.resolve(process.cwd(), 'bck_database', 'leads_rows_sql.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    // Executa o SQL de backup diretamente para preservar IDs e timestamps
    await prisma.$executeRawUnsafe(content);
    console.log('✅ Leads inseridos via SQL de backup');
  } catch (error) {
    console.error('❌ Erro ao popular leads:', error);
    throw error;
  }
}