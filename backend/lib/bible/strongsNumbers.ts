/**
 * Utilidad para gestionar números Strong y concordancia en LBLA
 * Base de datos ligera local con SQLite
 */

export interface StrongsEntry {
  code: string; // G25, H430, etc
  lemma: string;
  transliteration: string;
  definition: string;
}

export interface BibleVerseEntry {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface ConcordanceEntry {
  verseId: string;
  strongCode: string;
  reference: string; // "1 Juan 4:9"
}

/**
 * Dataset de Strong's Numbers más comunes en LBLA
 * Griegos (G) y Hebreos (H)
 */
export const STRONGS_DICTIONARY: Record<string, StrongsEntry> = {
  G25: {
    code: 'G25',
    lemma: 'agapao',
    transliteration: 'agapáō',
    definition: 'Amar profundamente; poseer affection sincera y desinteresada por alguien',
  },
  G26: {
    code: 'G26',
    lemma: 'agape',
    transliteration: 'agápē',
    definition: 'Amor altruista, benevolencia divina y amor cristiano',
  },
  G2889: {
    code: 'G2889',
    lemma: 'kosmos',
    transliteration: 'kósmos',
    definition:
      'El mundo creado; el sistema del mundo; la humanidad; el universo material ordenado',
  },
  G3439: {
    code: 'G3439',
    lemma: 'monogenes',
    transliteration: 'monogénēs',
    definition: 'Unigénito; el único hijo; único de su clase o especie',
  },
  G2233: {
    code: 'G2233',
    lemma: 'hedone',
    transliteration: 'hedón(ē)',
    definition: 'Placer; deleite; gozo sensual',
  },
  G1680: {
    code: 'G1680',
    lemma: 'elpis',
    transliteration: 'elpís',
    definition:
      'Esperanza; expectativa confiada; aquello que se espera; confianza en el futuro de Dios',
  },
  H430: {
    code: 'H430',
    lemma: 'Elohim',
    transliteration: 'Elohím',
    definition: 'Dios; Dioses; supremacía divina y poder',
  },
};

/**
 * Estructura de concordancia local
 * Mapea Strong Code -> referencias en LBLA
 */
export const LOCAL_CONCORDANCE: Record<string, ConcordanceEntry[]> = {
  G25: [
    { verseId: 'juan-3-16', strongCode: 'G25', reference: 'Juan 3:16' },
    { verseId: 'romanos-5-8', strongCode: 'G25', reference: 'Romanos 5:8' },
    { verseId: '1-juan-4-9', strongCode: 'G25', reference: '1 Juan 4:9' },
    { verseId: '1-corintios-13-4', strongCode: 'G25', reference: '1 Corintios 13:4' },
  ],
  G2889: [
    { verseId: 'juan-3-16', strongCode: 'G2889', reference: 'Juan 3:16' },
    { verseId: 'mateo-24-14', strongCode: 'G2889', reference: 'Mateo 24:14' },
    { verseId: 'juan-1-10', strongCode: 'G2889', reference: 'Juan 1:10' },
  ],
  G3439: [
    { verseId: 'juan-3-16', strongCode: 'G3439', reference: 'Juan 3:16' },
    { verseId: '1-juan-4-9', strongCode: 'G3439', reference: '1 Juan 4:9' },
  ],
};

export class StrongsNumbersService {
  /**
   * Obtener entrada de Strong por código
   */
  static getStrong(code: string): StrongsEntry | undefined {
    return STRONGS_DICTIONARY[code];
  }

  /**
   * Obtener todas las concordancias para un Strong Code
   */
  static getConcordanceByStrong(strongCode: string): ConcordanceEntry[] {
    return LOCAL_CONCORDANCE[strongCode] || [];
  }

  /**
   * Obtener definición rápida
   */
  static getDefinition(strongCode: string): string {
    const entry = this.getStrong(strongCode);
    return entry ? entry.definition : 'Definición no disponible';
  }

  /**
   * Buscar Strong por lema
   */
  static searchByLemma(lemma: string): StrongsEntry[] {
    return Object.values(STRONGS_DICTIONARY).filter(
      (entry) =>
        entry.lemma.toLowerCase().includes(lemma.toLowerCase()) ||
        entry.transliteration.toLowerCase().includes(lemma.toLowerCase())
    );
  }
}
