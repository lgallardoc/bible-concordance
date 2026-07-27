import { bibleService } from '../lib/bible/bibleService';
import { BibleReferenceParser } from '../lib/bible/referenceParser';
import { describe, it, beforeAll, expect } from '../scripts/test-runner';

describe('Bible Concordance - Servicios de Búsqueda', () => {
  // Configurar antes de ejecutar tests
  beforeAll(async () => {
    console.log('🔄 Inicializando servicio LBLA para tests...');
    await bibleService.initialize();
    
    // Esperar a que el índice esté listo
    let attempts = 0;
    while (!bibleService.getStatus().ready && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    if (!bibleService.getStatus().ready) {
      throw new Error('El servicio LBLA no se inicializó a tiempo');
    }
    console.log('✅ Servicio LBLA listo para tests');
  });

  describe('Búsqueda por Tema', () => {
    it('debe encontrar citas del tema "amor"', () => {
      const result = bibleService.concordance('amor', 100);
      
      expect(result).toBeDefined();
      expect(result.tema).toBe('amor');
      expect(result.totalCitas).toBeGreaterThan(0);
      expect(Array.isArray(result.versiculos)).toBe(true);
      expect(result.versiculos.length).toBeGreaterThan(0);
      
      console.log(`  ✓ Encontradas ${result.totalCitas} citas de "${result.tema}"`);
    });

    it('debe encontrar citas del tema "fe"', () => {
      const result = bibleService.concordance('fe', 100);
      
      expect(result).toBeDefined();
      expect(result.tema).toBe('fe');
      expect(result.totalCitas).toBeGreaterThan(0);
      
      console.log(`  ✓ Encontradas ${result.totalCitas} citas de "${result.tema}"`);
    });

    it('debe encontrar citas del tema "paz"', () => {
      const result = bibleService.concordance('paz', 100);
      
      expect(result).toBeDefined();
      expect(result.tema).toBe('paz');
      expect(result.totalCitas).toBeGreaterThan(0);
      
      console.log(`  ✓ Encontradas ${result.totalCitas} citas de "${result.tema}"`);
    });

    it('debe retornar estructura correcta de versículos', () => {
      const result = bibleService.concordance('amor', 10);
      
      const primerasCitas = result.versiculos.slice(0, 5);
      primerasCitas.forEach(cita => {
        expect(typeof cita).toBe('string');
        expect(cita).toMatch(/\w+\s+\d+:\d+/); // Mateo 1:1 o similar
      });
      
      console.log(`  ✓ Formato de citas válido: ${primerasCitas[0]}, ${primerasCitas[1]}, ...`);
    });
  });

  describe('Conteo de Citas por Tema', () => {
    it('debe contar correctamente citas de "amor"', () => {
      const concordancia = bibleService.concordance('amor', 1000);
      
      expect(concordancia.totalCitas).toBeGreaterThan(100);
      expect(concordancia.totalCitas).toBeLessThan(500);
      
      console.log(`  ✓ Total de citas: ${concordancia.totalCitas}`);
    });

    it('debe contar correctamente citas de "fe"', () => {
      const concordancia = bibleService.concordance('fe', 1000);
      
      expect(concordancia.totalCitas).toBeGreaterThan(0);
      
      console.log(`  ✓ Total de citas: ${concordancia.totalCitas}`);
    });

    it('debe respetar el límite de citas', () => {
      const limit = 50;
      const result = bibleService.concordance('amor', limit);
      
      expect(result.versiculos.length).toBeLessThanOrEqual(limit);
      
      console.log(`  ✓ Límite respetado: ${result.versiculos.length} <= ${limit}`);
    });

    it('debe retornar cantidad total diferente al número de resultados si excede límite', () => {
      const limit = 20;
      const result = bibleService.concordance('amor', limit);
      
      expect(result.totalCitas).toBeGreaterThanOrEqual(result.versiculos.length);
      
      console.log(`  ✓ Total: ${result.totalCitas}, Mostrados: ${result.versiculos.length}`);
    });
  });

  describe('Rescate de Citas Específicas', () => {
    it('debe obtener pasaje por referencia directa', () => {
      const ref = { book: 'Juan', chapter: 3, startVerse: 16, endVerse: 16 };
      const result = bibleService.getPassage(ref);
      
      expect(result).toBeDefined();
      expect(result?.length).toBeGreaterThan(0);
      
      console.log(`  ✓ Pasaje Juan 3:16 obtenido: ${result?.[0]?.cita}`);
    });

    it('debe obtener rango de versículos', () => {
      const ref = { book: 'Mateo', chapter: 22, startVerse: 37, endVerse: 40 };
      const result = bibleService.getPassageRange(ref);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      console.log(`  ✓ Rango Mateo 22:37-40 obtiene ${result.length} versículos`);
    });

    it('debe proporcionar texto completo del versículo', () => {
      const concordancia = bibleService.concordance('amor', 5);
      expect(concordancia.versiculos.length).toBeGreaterThan(0);
      
      const primerVersículo = concordancia.versiculos[0];
      expect(primerVersículo).toBeDefined();
      expect(typeof primerVersículo).toBe('string');
      
      console.log(`  ✓ Versículo completo: ${primerVersículo}`);
    });
  });

  describe('Búsqueda por Texto Completo', () => {
    it('debe encontrar resultados con búsqueda por texto', () => {
      const results = bibleService.searchByText('amor');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      console.log(`  ✓ Búsqueda de texto "amor" retorna ${results.length} resultados`);
    });

    it('debe encontrar referencias en búsqueda fuzzy', () => {
      const results = bibleService.searchByText('amor', { limit: 50, fuzzy: true });
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      console.log(`  ✓ Búsqueda fuzzy retorna ${results.length} resultados`);
    });

    it('debe limitar resultados correctamente', () => {
      const limit = 10;
      const results = bibleService.searchByText('amor', { limit });
      
      expect(results.length).toBeLessThanOrEqual(limit);
      
      console.log(`  ✓ Límite de ${limit} respetado: ${results.length} resultados`);
    });
  });

  describe('Parser de Referencias Bíblicas', () => {
    it('debe parsear "Mateo 22:1" correctamente', () => {
      const ref = BibleReferenceParser.parse('Mateo 22:1');
      
      expect(ref.book).toBe('Mateo');
      expect(ref.chapter).toBe(22);
      expect(ref.startVerse).toBe(1);
      expect(ref.isRange).toBe(false);
      
      console.log(`  ✓ Parseado: ${ref.originalInput} → ${ref.book} ${ref.chapter}:${ref.startVerse}`);
    });

    it('debe parsear rango "Juan 3:16-20" correctamente', () => {
      const ref = BibleReferenceParser.parse('Juan 3:16-20');
      
      expect(ref.book).toBe('Juan');
      expect(ref.chapter).toBe(3);
      expect(ref.startVerse).toBe(16);
      expect(ref.endVerse).toBe(20);
      expect(ref.isRange).toBe(true);
      
      console.log(`  ✓ Parseado rango: ${ref.book} ${ref.chapter}:${ref.startVerse}-${ref.endVerse}`);
    });

    it('debe parsear libro con número "1 Corintios 13:4"', () => {
      const ref = BibleReferenceParser.parse('1 Corintios 13:4');
      
      expect(ref.book).toBe('1 Corintios');
      expect(ref.chapter).toBe(13);
      expect(ref.startVerse).toBe(4);
      
      console.log(`  ✓ Parseado: ${ref.book} ${ref.chapter}:${ref.startVerse}`);
    });
  });

  describe('Status del Índice', () => {
    it('debe reportar estado del índice correctamente', () => {
      const status = bibleService.getStatus();
      
      expect(status.ready).toBe(true);
      expect(status.totalVerses).toBeGreaterThan(30000);
      expect(status.totalBooks).toBe(66);
      expect(status.indexSize).toBeGreaterThan(0);
      
      console.log(`  ✓ Estado: ${status.totalVerses} versículos, ${status.totalBooks} libros`);
    });

    it('debe indicar progreso de inicialización', () => {
      const status = bibleService.getStatus();
      
      expect(status).toHaveProperty('ready');
      expect(status).toHaveProperty('totalVerses');
      expect(status).toHaveProperty('totalBooks');
      
      console.log(`  ✓ Propiedades de status: ready=${status.ready}`);
    });
  });

  describe('Casos de Error', () => {
    it('debe manejar temas no encontrados gracefully', () => {
      const result = bibleService.concordance('xyzabc123', 10);
      
      expect(result.tema).toBe('xyzabc123');
      expect(result.totalCitas).toBe(0);
      expect(result.versiculos.length).toBe(0);
      
      console.log(`  ✓ Tema no encontrado manejado correctamente`);
    });

    it('debe validar referencias inválidas', () => {
      expect(() => {
        BibleReferenceParser.parse('Invalid Reference 999:999');
      }).not.toThrow();
      
      console.log(`  ✓ Referencia inválida no causa error`);
    });
  });
});
