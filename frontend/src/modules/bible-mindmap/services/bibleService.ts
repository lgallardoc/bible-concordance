import type { BibleVerse, StrongsNumber, VerseWord, ConcordanceEntry } from '../types';

const VERSES_DATA: BibleVerse[] = [
  {
    id: 'juan-3-16',
    book: 'Juan',
    chapter: 3,
    verse: 16,
    text: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.',
    strongsReferences: ['G25', 'G2889', 'G3439'],
  },
  {
    id: 'romanos-5-8',
    book: 'Romanos',
    chapter: 5,
    verse: 8,
    text: 'Mas Dios muestra su amor para con nosotros, en que siendo aún pecadores, Cristo murió por nosotros.',
    strongsReferences: ['G25'],
  },
  {
    id: '1-juan-4-9',
    book: '1 Juan',
    chapter: 4,
    verse: 9,
    text: 'En esto se mostró el amor de Dios para con nosotros, en que Dios envió a su Hijo unigénito al mundo, para que vivamos por él.',
    strongsReferences: ['G25', 'G3439'],
  },
  {
    id: 'mateo-24-14',
    book: 'Mateo',
    chapter: 24,
    verse: 14,
    text: 'Y será predicado este evangelio del reino en todo el mundo, para testimonio a todas las naciones; y entonces vendrá el fin.',
    strongsReferences: ['G2889'],
  },
];

const STRONGS_DATA: StrongsNumber[] = [
  {
    code: 'G25',
    lemma: 'agapao',
    transliteration: 'agapáō',
    definition: 'Amar profundamente; tener amor sincero y desinteresado',
    concordanceCount: 143,
  },
  {
    code: 'G2889',
    lemma: 'kosmos',
    transliteration: 'kósmos',
    definition: 'El mundo; la tierra; la humanidad; el sistema del mundo',
    concordanceCount: 186,
  },
  {
    code: 'G3439',
    lemma: 'monogenes',
    transliteration: 'monogénēs',
    definition: 'Unigénito; único hijo; el único de su clase',
    concordanceCount: 9,
  },
];

const VERSE_WORDS_DATA: VerseWord[] = [
  { verseId: 'juan-3-16', word: 'amó', strongCode: 'G25' },
  { verseId: 'juan-3-16', word: 'mundo', strongCode: 'G2889' },
  { verseId: 'juan-3-16', word: 'Hijo unigénito', strongCode: 'G3439' },
  { verseId: 'romanos-5-8', word: 'amor', strongCode: 'G25' },
  { verseId: '1-juan-4-9', word: 'amor', strongCode: 'G25' },
  { verseId: '1-juan-4-9', word: 'Hijo unigénito', strongCode: 'G3439' },
  { verseId: 'mateo-24-14', word: 'mundo', strongCode: 'G2889' },
];

const CONCORDANCE_DATA: ConcordanceEntry[] = [
  {
    verseId: 'juan-3-16',
    reference: 'Romanos 5:8',
    text: 'Mas Dios muestra su amor para con nosotros...',
    strongCode: 'G25',
  },
  {
    verseId: 'juan-3-16',
    reference: '1 Juan 4:9',
    text: 'En esto se mostró el amor de Dios para con nosotros...',
    strongCode: 'G25',
  },
  {
    verseId: 'juan-3-16',
    reference: 'Mateo 24:14',
    text: 'Y será predicado este evangelio del reino en todo el mundo...',
    strongCode: 'G2889',
  },
];

export class BibleMindMapService {
  static getVerse(id: string): BibleVerse | undefined {
    return VERSES_DATA.find((v) => v.id === id);
  }

  static getStrongsNumber(code: string): StrongsNumber | undefined {
    return STRONGS_DATA.find((s) => s.code === code);
  }

  static getVerseStrongsReferences(verseId: string): StrongsNumber[] {
    const verse = this.getVerse(verseId);
    if (!verse) return [];
    return verse.strongsReferences
      .map((code) => this.getStrongsNumber(code))
      .filter(Boolean) as StrongsNumber[];
  }

  static getConcordanceByStrong(strongCode: string): ConcordanceEntry[] {
    return CONCORDANCE_DATA.filter((c) => c.strongCode === strongCode);
  }

  static getVerseReference(verseId: string): string {
    const verse = this.getVerse(verseId);
    if (!verse) return '';
    return `${verse.book} ${verse.chapter}:${verse.verse}`;
  }

  static getMockData() {
    return {
      verses: VERSES_DATA,
      strongs: STRONGS_DATA,
      verseWords: VERSE_WORDS_DATA,
      concordance: CONCORDANCE_DATA,
    };
  }
}
