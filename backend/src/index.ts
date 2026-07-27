console.log('⭐ INDEX.TS LOADED');

import express, { Express } from 'express';
import cors from 'cors';
import { inicializarBaseDatos, obtenerBaseDatos } from './config/database';
import { BibleService } from './services/bibleService';
import { ConcordanciaController } from './controllers/concordanciaController';
import { bibleService } from '../lib/bible/bibleService';
import bibleRoutes from './routes/bibleRoutes';

const app: Express = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
inicializarBaseDatos();

// Instanciar servicios y controladores (concordancia)
const db = obtenerBaseDatos();
const bibleServiceLegacy = new BibleService(db);
const concordanciaController = new ConcordanciaController(bibleServiceLegacy);

// Rutas de la API - Concordancia (legacy)
app.get('/api/concordancia/contar', (req, res) => concordanciaController.contarVersiculos(req, res));
app.get('/api/concordancia/descargar', (req, res) => concordanciaController.descargarCitas(req, res));
app.get('/api/concordancia/texto', (req, res) => concordanciaController.obtenerTextoVersiculo(req, res));
app.post('/api/cache/limpiar', (req, res) => concordanciaController.limpiarCache(req, res));

// Rutas de la API - Bible LBLA (nueva)
console.log('📍 DEBUG: About to add /api/bible routes');
console.log('📍 DEBUG: bibleRoutes type:', typeof bibleRoutes);
console.log('📍 DEBUG: bibleRoutes:', bibleRoutes);
app.use('/api/bible', bibleRoutes);
console.log('📍 DEBUG: Routes added successfully');


// Ruta de health check
app.get('/health', (_req, res) => {
  res.json({ status: 'Backend running on port 3000' });
});

// Debug: Log all registered routes
const router = (app as any)._router;
if (router && router.stack) {
  console.log('📍 DEBUG: Final app._router.stack.length:', router.stack.length);
  router.stack.forEach((layer: any, idx: number) => {
    if (layer.route) {
      console.log(`  ${idx}: ${Object.keys(layer.route.methods).join(',')} ${layer.route.path}`);
    } else if (layer.name === 'router') {
      console.log(`  ${idx}: router middleware on path ${(layer as any).regexp}`);
    }
  });
}



// Iniciar servidor y cargar servicios en background
const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`✓ Servidor ejecutándose en http://localhost:${PORT}`);
    console.log(`✓ CORS habilitado`);
    console.log(`✓ Base de datos SQLite inicializada`);
  });

  // Inicializar servicios en background (no bloquea inicio)
  console.log('🔄 Inicializando servicio de Bible LBLA...');
  try {
    await bibleService.initialize();
    console.log('✅ Servicio de Bible LBLA listo');
  } catch (error) {
    console.error('❌ Error inicializando Bible LBLA:', error);
    console.log('⚠️  El servicio seguirá disponible pero sin datos');
  }
};

startServer().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n✓ Servidor cerrado correctamente');
  process.exit(0);
});
