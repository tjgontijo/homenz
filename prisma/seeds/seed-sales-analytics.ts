import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

export async function seedSalesAnalytics(prisma: PrismaClient) {
  console.log('🌱 Populando sales_analytics a partir de SQL...');
  try {
    const sqlPath = path.resolve(process.cwd(), 'bck_database', 'sales_analytics_rows.sql');
    const content = fs.readFileSync(sqlPath, 'utf-8');
    // Executa o SQL de backup diretamente para preservar IDs, timestamps e JSONB em `conversation`
    await prisma.$executeRawUnsafe(content);
    console.log('✅ Sales analytics inseridos via SQL de backup');
  } catch (error) {
    console.error('❌ Erro ao popular sales_analytics:', error);
    throw error;
  }
}