import { Request, Response } from 'express';
import { BibleService } from '../services/bibleService';
import { TemaConcordancia } from '../types/index';

// Cache en memoria para estrategia Cache-First
const cache = new Map<string, TemaConcordancia>();
const cacheConteo = new Map<string, number>();

export class ConcordanciaController {
  private bibleService: BibleService;

  constructor(bibleService: BibleService) {
    this.bibleService = bibleService;
  }

  /**
   * FASE 1: Contar versículos encontrados
   */
  async contarVersiculos(req: Request, res: Response): Promise<void> {
    try {
      const { tema } = req.query;

      if (!tema || typeof tema !== 'string') {
        res.status(400).json({ error: 'El parámetro "tema" es requerido' });
        return;
      }

      // Comprobar si ya tenemos el conteo en caché
      if (cacheConteo.has(tema)) {
        console.log(`✓ Conteo en caché para tema: ${tema}`);
        res.json({
          tema,
          total: cacheConteo.get(tema),
        });
        return;
      }

      // Contar desde API
      console.log(`📊 Contando versículos para tema: ${tema}`);
      const total = await this.bibleService.contarVersiculos(tema);

      // Guardar conteo en caché
      cacheConteo.set(tema, total);

      res.json({
        tema,
        total,
      });
    } catch (error) {
      console.error('Error en contarVersiculos:', error);
      res.status(500).json({
        error: 'Error al contar versículos',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * FASE 2: Descargar citas del tema
   */
  async descargarCitas(req: Request, res: Response): Promise<void> {
    try {
      const { tema } = req.query;

      if (!tema || typeof tema !== 'string') {
        res.status(400).json({ error: 'El parámetro "tema" es requerido' });
        return;
      }

      // Comprobar caché primero
      if (cache.has(tema)) {
        console.log(`✓ Citas en caché para tema: ${tema}`);
        res.json({
          source: 'cache',
          data: cache.get(tema),
        });
        return;
      }

      // Descargar citas desde API
      console.log(`⬇️ Descargando citas para tema: ${tema}`);
      const citas = await this.bibleService.descargarCitas(tema, (progreso, total) => {
        // Aquí podrías enviar eventos de progreso si usas WebSockets
        console.log(`⏳ Progreso: ${progreso}/${total}`);
      });

      const temaConcordancia: TemaConcordancia = {
        tema,
        versiculos: citas,
      };

      // Guardar en caché
      cache.set(tema, temaConcordancia);

      res.json({
        source: 'network',
        data: temaConcordancia,
      });
    } catch (error) {
      console.error('Error en descargarCitas:', error);
      res.status(500).json({
        error: 'Error al descargar citas',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtener texto completo de un versículo
   */
  async obtenerTextoVersiculo(req: Request, res: Response): Promise<void> {
    try {
      const { cita } = req.query;

      if (!cita || typeof cita !== 'string') {
        res.status(400).json({ error: 'El parámetro "cita" es requerido' });
        return;
      }

      console.log(`📖 Obteniendo texto de: ${cita}`);
      const texto = await this.bibleService.obtenerTextoVersiculo(cita);

      res.json({
        cita,
        texto,
      });
    } catch (error) {
      console.error('Error en obtenerTextoVersiculo:', error);
      res.status(500).json({
        error: 'Error al obtener texto del versículo',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Limpia el caché en memoria y en BD
   */
  limpiarCache(_req: Request, res: Response): void {
    cache.clear();
    cacheConteo.clear();
    res.json({ message: 'Caché limpiado correctamente' });
  }
}
