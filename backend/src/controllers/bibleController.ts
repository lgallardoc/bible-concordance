/**
 * Controlador para endpoints de Bible API (LBLA)
 */

import { Request, Response } from 'express';
import { bibleService } from '../../lib/bible/bibleService';

/**
 * GET /api/bible/status
 * Obtener estado del servicio
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  console.log('🎯 getStatus called');
  const status = bibleService.getStatus();
  
  if (!status.ready) {
    res.status(503).json({
      error: 'Servicio no inicializado',
      message: 'El índice está siendo construido. Intenta de nuevo en unos momentos.',
      status,
    });
    return;
  }

  res.json({
    ready: status.ready,
    totalVerses: status.totalVerses,
    cacheExists: status.cacheExists,
    indexExists: status.indexExists,
  });
}

/**
 * GET /api/bible/passage?ref=Mateo+22:1
 * Obtener un pasaje específico
 */
export async function getPassage(req: Request, res: Response): Promise<void> {
  try {
    const { ref } = req.query;

    if (!ref || typeof ref !== 'string') {
      res.status(400).json({
        error: 'Parámetro faltante',
        message: 'Se requiere el parámetro "ref" (e.g., ?ref=Juan+3:16)',
      });
      return;
    }

    const status = bibleService.getStatus();
    if (!status.ready) {
      res.status(503).json({
        error: 'Servicio no inicializado',
        message: 'El índice está siendo construido.',
      });
      return;
    }

    const verse = await bibleService.getPassage(ref);

    if (!verse) {
      res.status(404).json({
        error: 'Pasaje no encontrado',
        reference: ref,
      });
      return;
    }

    res.json({
      reference: `${verse.book} ${verse.chapter}:${verse.number}`,
      version: 'LBLA',
      verses: [
        {
          number: verse.number,
          text: verse.text,
        },
      ],
      text: verse.text,
    });
  } catch (error) {
    console.error('Error obteniendo pasaje:', error);
    res.status(400).json({
      error: 'Referencia inválida',
      message: (error as Error).message,
    });
  }
}

/**
 * GET /api/bible/search?q=pan+de+la+vida&limit=20&fuzzy=true
 * Buscar por texto
 */
export async function search(req: Request, res: Response): Promise<void> {
  try {
    const { q, limit = '20', fuzzy = 'true' } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        error: 'Parámetro faltante',
        message: 'Se requiere el parámetro "q" (query)',
      });
      return;
    }

    const status = bibleService.getStatus();
    if (!status.ready) {
      res.status(503).json({
        error: 'Servicio no inicializado',
      });
      return;
    }

    const results = await bibleService.searchByText(q, {
      limit: Math.min(parseInt(limit as string, 10) || 20, 100),
      fuzzy: fuzzy === 'true',
    });

    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      error: 'Error en la búsqueda',
      message: (error as Error).message,
    });
  }
}

/**
 * GET /api/bible/random
 * Obtener un versículo aleatorio
 */
export async function getRandomVerse(req: Request, res: Response): Promise<void> {
  try {
    const status = bibleService.getStatus();
    if (!status.ready) {
      res.status(503).json({
        error: 'Servicio no inicializado',
      });
      return;
    }

    const verse = await bibleService.getRandomVerse();

    if (!verse) {
      res.status(500).json({
        error: 'No se pudo obtener versículo aleatorio',
      });
      return;
    }

    res.json({
      reference: `${verse.book} ${verse.chapter}:${verse.number}`,
      version: 'LBLA',
      text: verse.text,
    });
  } catch (error) {
    console.error('Error obteniendo versículo aleatorio:', error);
    res.status(500).json({
      error: 'Error interno',
      message: (error as Error).message,
    });
  }
}

/**
 * GET /api/bible/concordance?term=amor&limit=100
 * Concordancia: listar todas las referencias de una palabra
 */
export async function getConcordance(req: Request, res: Response): Promise<void> {
  try {
    const { term, limit = '100' } = req.query;

    if (!term || typeof term !== 'string') {
      res.status(400).json({
        error: 'Parámetro faltante',
        message: 'Se requiere el parámetro "term"',
      });
      return;
    }

    const status = bibleService.getStatus();
    if (!status.ready) {
      res.status(503).json({
        error: 'Servicio no inicializado',
      });
      return;
    }

    const result = await bibleService.concordance(term, {
      limit: Math.min(parseInt(limit as string, 10) || 100, 1000),
    });

    res.json(result);
  } catch (error) {
    console.error('Error en concordancia:', error);
    res.status(500).json({
      error: 'Error en la concordancia',
      message: (error as Error).message,
    });
  }
}

/**
 * GET /api/bible/count-by-topic?topic=amor&semantic=false
 * Contar referencias por concepto/tema
 */
export async function countByTopic(req: Request, res: Response): Promise<void> {
  try {
    const { topic, semantic = 'false' } = req.query;

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({
        error: 'Parámetro faltante',
        message: 'Se requiere el parámetro "topic"',
      });
      return;
    }

    const status = bibleService.getStatus();
    if (!status.ready) {
      res.status(503).json({
        error: 'Servicio no inicializado',
      });
      return;
    }

    const result = await bibleService.countByTopic(topic, {
      semantic: semantic === 'true',
    });

    res.json(result);
  } catch (error) {
    console.error('Error contando por tema:', error);
    res.status(500).json({
      error: 'Error contando por tema',
      message: (error as Error).message,
    });
  }
}

/**
 * POST /api/bible/topics/refresh
 * Reconstruir el índice (limpiar caché y descargar nuevamente)
 */
export async function refreshIndex(req: Request, res: Response): Promise<void> {
  try {
    console.log('🔄 Reconstruyendo índice...');
    res.status(202).json({
      message: 'Reconstrucción iniciada en background',
      status: 'processing',
    });

    // Reconstruir en background sin bloquear
    setImmediate(async () => {
      try {
        await bibleService.rebuildIndex();
        console.log('✅ Índice reconstruido exitosamente');
      } catch (error) {
        console.error('❌ Error reconstruyendo índice:', error);
      }
    });
  } catch (error) {
    console.error('Error iniciando reconstrucción:', error);
    res.status(500).json({
      error: 'Error iniciando reconstrucción',
      message: (error as Error).message,
    });
  }
}
