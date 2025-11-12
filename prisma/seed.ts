import 'dotenv/config';

// Forçar uso de DIRECT_URL durante o seed para evitar problemas de pool
if (process.env.DIRECT_URL) {
  process.env.DATABASE_URL = process.env.DIRECT_URL;
}

// Executar a função main via import dinâmico após ajustar env
(async () => {
  try {
    const { main } = await import('./seeds/index');
    await main();
    console.log('Seed executado com sucesso!');
  } catch (e) {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  }
})();
