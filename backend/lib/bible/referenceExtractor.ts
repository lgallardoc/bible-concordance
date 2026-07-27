/**
 * Extrae referencias bíblicas de un texto
 * Detecta patrones como "Juan 3:16", "1 Corintios 13:4-7", etc.
 */

import { BibleReferenceParser } from './referenceParser';

// Patrón para detectar referencias bíblicas en español
// Ejemplos: Juan 3:16, 1 Corintios 13:4-7, Mateo 22:37-40
const REFERENCE_PATTERN = /(?:^|\s)(\d{0,2}\s+)?([A-Záéíóú]+)\s+(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?(?=\s|$|[.,;:!?])/gi;

export interface ExtractedReference {
  original: string;
  parsed: any; // Resultado del parser
  isValid: boolean;
}

export class ReferenceExtractor {
  /**
   * Extrae todas las referencias bíblicas de un texto
   */
  static extractReferences(texto: string): ExtractedReference[] {
    const referencias: ExtractedReference[] = [];
    const encontradas = new Set<string>(); // Para evitar duplicados

    let match;
    const regex = new RegExp(REFERENCE_PATTERN);

    while ((match = regex.exec(texto)) !== null) {
      const referencia = match[0].trim();

      if (!encontradas.has(referencia)) {
        encontradas.add(referencia);

        try {
          const parsed = BibleReferenceParser.parse(referencia);
          referencias.push({
            original: referencia,
            parsed,
            isValid: parsed.book !== null,
          });
        } catch (error) {
          // Silenciosa ignorar referencias inválidas
          referencias.push({
            original: referencia,
            parsed: null,
            isValid: false,
          });
        }
      }
    }

    return referencias;
  }

  /**
   * Extrae referencias válidas solamente
   */
  static extractValidReferences(texto: string): ExtractedReference[] {
    return this.extractReferences(texto).filter((ref) => ref.isValid);
  }

  /**
   * Convierte referencias extraídas a referencias normalizadas
   */
  static normalizeReferences(referencias: ExtractedReference[]): string[] {
    return referencias
      .filter((ref) => ref.isValid && ref.parsed)
      .map((ref) => {
        const { book, chapter, startVerse } = ref.parsed;
        return `${book} ${chapter}:${startVerse}`;
      });
  }
}
