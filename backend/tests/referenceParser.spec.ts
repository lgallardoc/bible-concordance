/**
 * Tests para el parser de referencias bíblicas
 */

import { BibleReferenceParser } from '../../lib/bible/referenceParser';

describe('BibleReferenceParser', () => {
  describe('parse', () => {
    it('debe parsear "Mateo 22:1" correctamente', () => {
      const result = BibleReferenceParser.parse('Mateo 22:1');
      expect(result.book).toBe('Matthew');
      expect(result.chapter).toBe(22);
      expect(result.startVerse).toBe(1);
      expect(result.endVerse).toBe(1);
      expect(result.isRange).toBe(false);
    });

    it('debe parsear "Juan 3:16-20" con rango', () => {
      const result = BibleReferenceParser.parse('Juan 3:16-20');
      expect(result.book).toBe('John');
      expect(result.chapter).toBe(3);
      expect(result.startVerse).toBe(16);
      expect(result.endVerse).toBe(20);
      expect(result.isRange).toBe(true);
    });

    it('debe parsear "1 Corintios 13:4-7"', () => {
      const result = BibleReferenceParser.parse('1 Corintios 13:4-7');
      expect(result.book).toBe('1 Corinthians');
      expect(result.chapter).toBe(13);
      expect(result.startVerse).toBe(4);
      expect(result.endVerse).toBe(7);
    });

    it('debe parsear con abreviaturas como "Mt 22:1"', () => {
      const result = BibleReferenceParser.parse('Mt 22:1');
      expect(result.book).toBe('Matthew');
      expect(result.chapter).toBe(22);
      expect(result.startVerse).toBe(1);
    });

    it('debe parsear "Génesis 1:1" correctamente', () => {
      const result = BibleReferenceParser.parse('Génesis 1:1');
      expect(result.book).toBe('Genesis');
      expect(result.chapter).toBe(1);
      expect(result.startVerse).toBe(1);
    });
  });

  describe('format', () => {
    it('debe formatear a "Mateo 22:1" correctamente', () => {
      const ref = {
        book: 'Matthew',
        chapter: 22,
        startVerse: 1,
        endVerse: 1,
        isRange: false,
        isChapterRange: false,
        originalInput: 'Mateo 22:1',
      };
      const result = BibleReferenceParser.format(ref);
      expect(result).toBe('Matthew 22:1');
    });

    it('debe formatear con rango como "John 3:16-20"', () => {
      const ref = {
        book: 'John',
        chapter: 3,
        startVerse: 16,
        endVerse: 20,
        isRange: true,
        isChapterRange: false,
        originalInput: 'Juan 3:16-20',
      };
      const result = BibleReferenceParser.format(ref);
      expect(result).toBe('John 3:16-20');
    });
  });
});
