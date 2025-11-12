import { PrismaClient } from '@prisma/client';
import { seedLeads } from './seed-leads';
import { seedInbounds } from './seed-inbounds';
import { seedSales } from './seed-sales';
import { seedSalesAnalytics } from './seed-sales-analytics';


const prisma = new PrismaClient();

async function cleanDatabase() { 
  try {
    // Ordem de deleção respeitando relações:
    // sales -> inbounds; sales_analytics -> leads
    await prisma.sales.deleteMany();
    //await prisma.sales_analytics.deleteMany();
    await prisma.inbounds.deleteMany();
    await prisma.leads.deleteMany();
  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
    throw error;
  }
}

async function createInitialData() {
  console.log('🌱 Iniciando população do banco de dados...');

  try {
    console.log('🧹 Limpando banco de dados...');
    await cleanDatabase();
    console.log('✅ Banco de dados limpo.');

    // Popula dados em ordem para respeitar chaves estrangeiras
    await seedLeads(prisma);
    await seedInbounds(prisma);
    await seedSales(prisma);
    //await seedSalesAnalytics(prisma);

    console.log('✅ População do banco de dados concluída com sucesso!');
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ Erro ao popular o banco de dados: ${error.message}`);
      console.error(error.stack);
    } else {
      console.error(`❌ Erro desconhecido ao popular o banco de dados: ${String(error)}`);
    }
    throw error;
  }
}

// Exportar a função main para ser usada em seed.ts
export async function main() {
  try {
    await createInitialData();
  } catch (error) {
    console.error('❌ Falha na execução do seed');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexão com o banco de dados encerrada.');
  }
}

if (require.main === module) {
  main();
}
