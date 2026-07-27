/**
 * Rutas para API de Bible (LBLA)
 */

import { Router } from 'express';
import {
  getStatus,
  getPassage,
  search,
  getRandomVerse,
  getConcordance,
  countByTopic,
  refreshIndex,
} from '../controllers/bibleController';

const router = Router();

/**
 * Status endpoint - verificar disponibilidad del servicio
 */
router.get('/status', getStatus);

/**
 * Obtener pasaje por referencia
 * GET /api/bible/passage?ref=Mateo+22:1
 */
router.get('/passage', getPassage);

/**
 * Buscar por texto
 * GET /api/bible/search?q=pan+de+la+vida&limit=20&fuzzy=true
 */
router.get('/search', search);

/**
 * Versículo aleatorio
 * GET /api/bible/random
 */
router.get('/random', getRandomVerse);

/**
 * Concordancia
 * GET /api/bible/concordance?term=amor&limit=100
 */
router.get('/concordance', getConcordance);

/**
 * Contar por tema/concepto
 * GET /api/bible/count-by-topic?topic=amor&semantic=false
 */
router.get('/count-by-topic', countByTopic);

/**
 * Reconstruir índice
 * POST /api/bible/topics/refresh
 */
router.post('/topics/refresh', refreshIndex);

export default router;
