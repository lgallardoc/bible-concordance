import { Request, Response } from 'express';
import { BibleService } from '../services/bibleService';
import { TemaConcordancia } from '../types/index';

// Cache en memoria para estrategia Cache-First
const cache = new Map<string, TemaConcordancia>();

export class ConcordanciaController {
  private bibleService: BibleService;

  constructor(bibleService: BibleService) {
    this.bibleService = bibleService;
  }

  /**
   * Estrategia Cache-First:
   * 1. Comprueba si existe en caché
   * 2. Si no existe, busca en local
   * 3. Si no existe en local, busca en red
   * 4. Guarda en cache y responde
   */
  async obtenerConcordancia(req: Request, res: Response): Promise<void> {
    try {
      const { tema } = req.query;

      if (!tema || typeof tema !== 'string') {
        res.status(400).json({ error: 'El parámetro "tema" es requerido' });
        return;
      }

      // 1. Comprobar caché
      if (cache.has(tema)) {
        console.log(`✓ Caché hit para tema: ${tema}`);
        res.json({
          source: 'cache',
          data: cache.get(tema),
        });
        return;
      }

      // 2. Buscar en base de datos local
      const temaBD = this.bibleService.obtenerTemaLocal(tema);
      if (temaBD) {
        console.log(`✓ BD hit para tema: ${tema}`);
        cache.set(tema, temaBD);
        res.json({
          source: 'database',
          data: temaBD,
        });
        return;
      }

      // 3. Buscar en la red (simulado)
      console.log(`🌐 Buscando en red para tema: ${tema}`);
      const temaRed = await this.bibleService.buscarEnRedYGuardar(tema);

      // 4. Guardar en caché y responder
      cache.set(tema, temaRed);
      res.json({
        source: 'network',
        data: temaRed,
      });
    } catch (error) {
      console.error('Error en obtenerConcordancia:', error);
      res.status(500).json({
        error: 'Error al obtener la concordancia',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Limpia el caché en memoria
   */
  limpiarCache(_req: Request, res: Response): void {
    cache.clear();
    res.json({ message: 'Caché limpiado correctamente' });
  }
}
