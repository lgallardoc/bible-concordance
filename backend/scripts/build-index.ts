/**
 * Script CLI para reconstruir el índice de Bible LBLA
 * Uso: npx ts-node scripts/build-index.ts
 */

import { bibleService } from '../lib/bible/bibleService';

async function main() {
  console.log('🔨 Construyendo índice de Bible LBLA...\n');

  try {
    await bibleService.rebuildIndex();
    console.log('\n✅ Índice construido exitosamente');

    const status = bibleService.getStatus();
    console.log(`\n📊 Estadísticas:`);
    console.log(`   Total versículos: ${status.totalVerses}`);
    console.log(`   Caché en disco: ${status.cacheExists ? '✅ Sí' : '❌ No'}`);
    console.log(`   Índice en disco: ${status.indexExists ? '✅ Sí' : '❌ No'}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error construyendo índice:', error);
    process.exit(1);
  }
}

main();
