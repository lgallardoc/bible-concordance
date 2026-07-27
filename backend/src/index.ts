import express, { Express } from 'express';
import cors from 'cors';
import { inicializarBaseDatos, obtenerBaseDatos } from './config/database';
import { BibleService } from './services/bibleService';
import { ConcordanciaController } from './controllers/concordanciaController';

const app: Express = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Inicializar base de datos
inicializarBaseDatos();

// Instanciar servicios y controladores
const db = obtenerBaseDatos();
const bibleService = new BibleService(db);
const concordanciaController = new ConcordanciaController(bibleService);

// Rutas de la API
app.get('/api/concordancia/contar', (req, res) => concordanciaController.contarVersiculos(req, res));
app.get('/api/concordancia/descargar', (req, res) => concordanciaController.descargarCitas(req, res));
app.get('/api/concordancia/texto', (req, res) => concordanciaController.obtenerTextoVersiculo(req, res));
app.post('/api/cache/limpiar', (req, res) => concordanciaController.limpiarCache(req, res));

// Ruta de health check
app.get('/health', (_req, res) => {
  res.json({ status: 'Backend running on port 3000' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`✓ Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`✓ CORS habilitado`);
  console.log(`✓ Base de datos SQLite inicializada`);
});

// Manejo de cierre
process.on('SIGINT', () => {
  console.log('\n✓ Servidor cerrado correctamente');
  process.exit(0);
});
