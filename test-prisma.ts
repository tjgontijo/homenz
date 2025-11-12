import { prisma } from '@/lib/prisma';

async function main() {
  const leads = await prisma.leads.findMany({ take: 5 });
  console.log('Leads', leads);
}

main().finally(() => prisma.$disconnect());
