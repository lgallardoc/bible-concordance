/**
 * Servicio principal de Bible con integración LBLA
 * Descarga, cachea, indexa y proporciona búsqueda
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Fuse from 'fuse.js';
import { BibleReferenceParser, BibleReference } from '../bible/referenceParser';

// Configuración
const LBLA_URL = 'https://mrk214.github.io/bible-data-es-spa/data/es___spa___spa/LBLA_vid_89.json';
const CACHE_DIR = path.join(process.cwd(), 'data', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'LBLA_vid_89.json');
const INDEX_FILE = path.join(CACHE_DIR, 'index-v1.json');

// Tipos
export interface Verse {
  book: string;
  chapter: number;
  number: number;
  text: string;
}

export interface VerseIndex {
  reference: string;
  book: string;
  chapter: number;
  number: number;
  text: string;
}

export interface SearchResult {
  reference: string;
  score: number;
  snippet: string;
}

export interface ConcordanceResult {
  term: string;
  totalOccurrences: number;
  references: Array<{
    reference: string;
    occurrences: number;
    snippets: string[];
  }>;
}

export interface IndexData {
  version: string;
  timestamp: number;
  totalVerses: number;
  verses: VerseIndex[];
  invertedIndex: Record<string, { references: string[]; count: number }>;
}

class BibleService {
  private index: IndexData | null = null;
  private fuse: Fuse<VerseIndex> | null = null;
  private isInitialized = false;
  private isInitializing = false;

  /**
   * Inicializar el servicio: cargar caché, construir índice
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) return;
    
    this.isInitializing = true;
    
    try {
      // Crear directorio si no existe
      if (!fs.existsSync(CACHE_DIR)) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
      }

      // Intentar cargar índice serializado
      if (fs.existsSync(INDEX_FILE)) {
        console.log('📚 Cargando índice desde caché...');
        this.index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
        this._initFuse();
        this.isInitialized = true;
        this.isInitializing = false;
        console.log('✅ Índice cargado. Total versículos:', this.index!.totalVerses);
        return;
      }

      // Si no hay índice, construirlo
      console.log('🔄 Construyendo índice (primera vez)...');
      await this.buildIndex();
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ Índice construido exitosamente');
    } catch (error) {
      this.isInitializing = false;
      console.error('❌ Error inicializando servicio:', error);
      throw error;
    }
  }

  /**
   * Construir el índice completo desde LBLA
   */
  private async buildIndex(): Promise<void> {
    // Descargar o cargar LBLA
    let lblaData: any;
    
    if (fs.existsSync(CACHE_FILE)) {
      console.log('📂 LBLA encontrada en caché local');
      lblaData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } else {
      console.log('📡 Descargando LBLA desde internet (~30MB)...');
      try {
        const response = await axios.get(LBLA_URL, {
          timeout: 60000,
          responseType: 'json',
        });
        lblaData = response.data;
        
        // Guardar en caché
        fs.writeFileSync(CACHE_FILE, JSON.stringify(lblaData), 'utf-8');
        console.log('💾 LBLA guardada en caché');
      } catch (error) {
        console.error('❌ Error descargando LBLA:', error);
        throw error;
      }
    }

    // Procesar y construir índice
    const verses: VerseIndex[] = [];
    const invertedIndex = new Map<string, { references: Set<string>; count: number }>();

    let bookCount = 0;
    for (const book of lblaData.books || []) {
      bookCount++;
      if (bookCount % 5 === 0) {
        console.log(`  📖 Procesando libro ${bookCount}/${(lblaData.books || []).length}...`);
      }

      for (const chapter of book.chapters || []) {
        const chapterNum = chapter.chapter_usfm?.split('.')[1];
        if (!chapterNum) continue;

        // Los versículos están en chapter.items
        for (const item of chapter.items || []) {
          if (item.type !== 'verse') continue;

          // Cada item puede contener múltiples versículos
          for (const verseNum of item.verse_numbers || []) {
            const text = (item.lines || []).join(' ');
            if (!text) continue;

            const reference = `${book.name} ${chapterNum}:${verseNum}`;
            
            verses.push({
              reference,
              book: book.name,
              chapter: parseInt(chapterNum, 10),
              number: verseNum,
              text,
            });

            // Construir índice invertido (por palabra)
            const words = this._tokenize(text);
            for (const word of words) {
              if (!word) continue;
              if (!invertedIndex.has(word)) {
                invertedIndex.set(word, { references: new Set(), count: 0 });
              }
              const entry = invertedIndex.get(word);
              if (entry) {
                entry.references.add(reference);
                entry.count += 1;
              }
            }
          }
        }
      }
    }

    // Convertir Map a objeto y Sets a arrays para serialización
    const serializedIndex: Record<string, { references: string[]; count: number }> = {};
    for (const [word, data] of invertedIndex) {
      serializedIndex[word] = {
        references: Array.from(data.references),
        count: data.count,
      };
    }

    // Crear IndexData
    this.index = {
      version: '1.0',
      timestamp: Date.now(),
      totalVerses: verses.length,
      verses,
      invertedIndex: serializedIndex,
    };

    // Guardar índice
    fs.writeFileSync(INDEX_FILE, JSON.stringify(this.index), 'utf-8');
    this._initFuse();
  }

  /**
   * Inicializar Fuse para búsqueda fuzzy
   */
  private _initFuse(): void {
    if (!this.index) return;

    this.fuse = new Fuse(this.index.verses, {
      keys: ['text', 'reference'],
      threshold: 0.3,
      minMatchCharLength: 2,
      includeScore: true,
    });
  }

  /**
   * Tokenizar texto (palabras simples)
   */
  private _tokenize(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^a-záéíóúñ\s]/g, '') // Remover puntuación
      .split(/\s+/)
      .filter(w => w && w.length > 2); // Solo palabras con 3+ caracteres y no vacías
  }

  /**
   * Obtener un pasaje por referencia
   */
  async getPassage(reference: string): Promise<Verse | null> {
    if (!this.index) await this.initialize();

    try {
      const parsed = BibleReferenceParser.parse(reference);
      const verse = this.index!.verses.find(
        v =>
          v.book === parsed.book &&
          v.chapter === parsed.chapter &&
          v.number === parsed.startVerse
      );

      return verse
        ? {
            book: verse.book,
            chapter: verse.chapter,
            number: verse.number,
            text: verse.text,
          }
        : null;
    } catch (error) {
      console.error('Error obteniendo pasaje:', error);
      return null;
    }
  }

  /**
   * Obtener un rango de versículos
   */
  async getPassageRange(reference: string): Promise<Verse[]> {
    if (!this.index) await this.initialize();

    try {
      const parsed = BibleReferenceParser.parse(reference);
      if (parsed.startVerse == null || parsed.endVerse == null) {
        return [];
      }
      const startV = parsed.startVerse;
      const endV = parsed.endVerse;
      return this.index!.verses.filter(
        v =>
          v.book === parsed.book &&
          v.chapter === parsed.chapter &&
          v.number >= startV &&
          v.number <= endV
      ) as Verse[];
    } catch (error) {
      console.error('Error obteniendo rango:', error);
      return [];
    }
  }

  /**
   * Buscar por texto (fuzzy)
   */
  async searchByText(
    query: string,
    options: { limit?: number; fuzzy?: boolean } = {}
  ): Promise<SearchResult[]> {
    if (!this.fuse || !this.index) await this.initialize();

    const { limit = 20, fuzzy = true } = options;
    const results = this.fuse!.search(query, { limit });

    return results.map(result => ({
      reference: result.item.reference,
      score: 1 - (result.score || 0), // Invertir score (0-1)
      snippet: this._makeSnippet(result.item.text, query, 100),
    }));
  }

  /**
   * Concordancia: buscar palabra y listar todas las referencias
   */
  async concordance(
    term: string,
    options: { limit?: number } = {}
  ): Promise<ConcordanceResult> {
    if (!this.index) await this.initialize();

    const { limit = 1000 } = options;
    const normalizedTerm = term.toLowerCase();
    const wordData = this.index!.invertedIndex[normalizedTerm];

    if (!wordData) {
      return {
        term,
        totalOccurrences: 0,
        references: [],
      };
    }

    // Construir resultado detallado
    const references = wordData.references.slice(0, limit).map(ref => {
      const verse = this.index!.verses.find(v => v.reference === ref);
      return {
        reference: ref,
        occurrences: 1, // Simplificado: asumir 1 por referencia
        snippets: verse ? [this._makeSnippet(verse.text, term, 80)] : [],
      };
    });

    return {
      term,
      totalOccurrences: wordData.count,
      references,
    };
  }

  /**
   * Contar referencias por concepto (clave o semántica simple)
   */
  async countByTopic(
    topic: string,
    options: { semantic?: boolean } = {}
  ): Promise<{ topic: string; count: number; references: string[] }> {
    if (!this.index) await this.initialize();

    const { semantic = false } = options;

    if (!semantic) {
      // Búsqueda simple por palabra clave
      const concordance = await this.concordance(topic, { limit: 1000 });
      return {
        topic,
        count: concordance.totalOccurrences,
        references: concordance.references.map(r => r.reference),
      };
    }

    // Opción semántica (TODO: integrar con embeddings)
    return {
      topic,
      count: 0,
      references: [],
    };
  }

  /**
   * Obtener versículo aleatorio
   */
  async getRandomVerse(): Promise<Verse | null> {
    if (!this.index) await this.initialize();

    const verses = this.index!.verses;
    const random = verses[Math.floor(Math.random() * verses.length)];

    return {
      book: random.book,
      chapter: random.chapter,
      number: random.number,
      text: random.text,
    };
  }

  /**
   * Obtener estado del servicio
   */
  getStatus(): {
    ready: boolean;
    totalVerses: number;
    cacheExists: boolean;
    indexExists: boolean;
  } {
    return {
      ready: this.isInitialized,
      totalVerses: this.index?.totalVerses || 0,
      cacheExists: fs.existsSync(CACHE_FILE),
      indexExists: fs.existsSync(INDEX_FILE),
    };
  }

  /**
   * Reconstruir índice (limpiar caché)
   */
  async rebuildIndex(): Promise<void> {
    if (fs.existsSync(INDEX_FILE)) {
      fs.unlinkSync(INDEX_FILE);
    }
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
    this.index = null;
    this.fuse = null;
    this.isInitialized = false;
    await this.initialize();
  }

  /**
   * Helper: hacer snippet de texto
   */
  private _makeSnippet(text: string, query: string, maxLength: number): string {
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index === -1) {
      return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
    }

    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + query.length + 20);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }
}

// Exportar instancia singleton
export const bibleService = new BibleService();
