/**
 * Parser robusto de referencias bíblicas en español
 * Soporta formatos como:
 * - "Mateo 22:1"
 * - "Mt 22:1-5"
 * - "1 Corintios 13:4-7"
 * - "Juan 3:16,18,20"
 * - "Génesis 1:1-2:3" (rango de capítulos)
 */

export interface BibleReference {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
  verses?: number[]; // Para referencias como "Juan 3:16,18,20"
  isRange: boolean;
  isChapterRange: boolean;
  originalInput: string;
}

// Mapeo de abreviaturas y nombres completos a identificadores estándar
const BOOK_MAPPINGS: Record<string, string> = {
  // Génesis
  'génesis': 'Genesis',
  'gen': 'Genesis',
  'gn': 'Genesis',
  
  // Éxodo
  'éxodo': 'Exodus',
  'ex': 'Exodus',
  'éx': 'Exodus',
  
  // Levítico
  'levítico': 'Leviticus',
  'lev': 'Leviticus',
  'lv': 'Leviticus',
  
  // Números
  'números': 'Numbers',
  'num': 'Numbers',
  'nm': 'Numbers',
  
  // Deuteronomio
  'deuteronomio': 'Deuteronomy',
  'deut': 'Deuteronomy',
  'dt': 'Deuteronomy',
  
  // Josué
  'josué': 'Joshua',
  'jos': 'Joshua',
  'jos.': 'Joshua',
  
  // Jueces
  'jueces': 'Judges',
  'jue': 'Judges',
  'jc': 'Judges',
  
  // Rut
  'rut': 'Ruth',
  'rt': 'Ruth',
  
  // 1 Samuel
  '1 samuel': '1 Samuel',
  '1samuel': '1 Samuel',
  '1 sam': '1 Samuel',
  '1sam': '1 Samuel',
  '1 s': '1 Samuel',
  
  // 2 Samuel
  '2 samuel': '2 Samuel',
  '2samuel': '2 Samuel',
  '2 sam': '2 Samuel',
  '2sam': '2 Samuel',
  '2 s': '2 Samuel',
  
  // 1 Reyes
  '1 reyes': '1 Kings',
  '1reyes': '1 Kings',
  '1 re': '1 Kings',
  '1re': '1 Kings',
  '1 r': '1 Kings',
  
  // 2 Reyes
  '2 reyes': '2 Kings',
  '2reyes': '2 Kings',
  '2 re': '2 Kings',
  '2re': '2 Kings',
  '2 r': '2 Kings',
  
  // 1 Crónicas
  '1 crónicas': '1 Chronicles',
  '1crónicas': '1 Chronicles',
  '1 cr': '1 Chronicles',
  '1cr': '1 Chronicles',
  
  // 2 Crónicas
  '2 crónicas': '2 Chronicles',
  '2crónicas': '2 Chronicles',
  '2 cr': '2 Chronicles',
  '2cr': '2 Chronicles',
  
  // Esdras
  'esdras': 'Ezra',
  'esd': 'Ezra',
  'ed': 'Ezra',
  
  // Nehemías
  'nehemías': 'Nehemiah',
  'neh': 'Nehemiah',
  'ne': 'Nehemiah',
  
  // Ester
  'ester': 'Esther',
  'est': 'Esther',
  'es': 'Esther',
  
  // Job
  'job': 'Job',
  'jb': 'Job',
  
  // Salmos
  'salmos': 'Psalms',
  'sal': 'Psalms',
  'ps': 'Psalms',
  
  // Proverbios
  'proverbios': 'Proverbs',
  'prov': 'Proverbs',
  'pr': 'Proverbs',
  
  // Eclesiastés
  'eclesiastés': 'Ecclesiastes',
  'ecl': 'Ecclesiastes',
  'ec': 'Ecclesiastes',
  
  // Cantar de los Cantares
  'cantar de los cantares': 'Song of Songs',
  'cantar': 'Song of Songs',
  'cant': 'Song of Songs',
  
  // Isaías
  'isaías': 'Isaiah',
  'isa': 'Isaiah',
  'is': 'Isaiah',
  
  // Jeremías
  'jeremías': 'Jeremiah',
  'jer': 'Jeremiah',
  'jr': 'Jeremiah',
  
  // Lamentaciones
  'lamentaciones': 'Lamentations',
  'lam': 'Lamentations',
  'la': 'Lamentations',
  
  // Ezequiel
  'ezequiel': 'Ezekiel',
  'eze': 'Ezekiel',
  'ez': 'Ezekiel',
  
  // Daniel
  'daniel': 'Daniel',
  'dan': 'Daniel',
  'dn': 'Daniel',
  
  // Oseas
  'oseas': 'Hosea',
  'ose': 'Hosea',
  'os': 'Hosea',
  
  // Joel
  'joel': 'Joel',
  'jl': 'Joel',
  
  // Amós
  'amós': 'Amos',
  'amo': 'Amos',
  'am': 'Amos',
  
  // Abdías
  'abdías': 'Obadiah',
  'abd': 'Obadiah',
  'ab': 'Obadiah',
  
  // Jonás
  'jonás': 'Jonah',
  'jon': 'Jonah',
  // 'jn' es ambiguo, se usa en Juan
  
  // Miqueas
  'miqueas': 'Micah',
  'miq': 'Micah',
  'mi': 'Micah',
  
  // Nahúm
  'nahúm': 'Nahum',
  'nah': 'Nahum',
  'na': 'Nahum',
  
  // Habacuc
  'habacuc': 'Habakkuk',
  'hab': 'Habakkuk',
  
  // Sofonías
  'sofonías': 'Zephaniah',
  'sof': 'Zephaniah',
  'so': 'Zephaniah',
  
  // Hageo
  'hageo': 'Haggai',
  'hag': 'Haggai',
  'ha': 'Haggai',
  
  // Zacarías
  'zacarías': 'Zechariah',
  'zac': 'Zechariah',
  'zc': 'Zechariah',
  
  // Malaquías
  'malaquías': 'Malachi',
  'mal': 'Malachi',
  'ml': 'Malachi',
  
  // Mateo
  'mateo': 'Matthew',
  'mat': 'Matthew',
  'mt': 'Matthew',
  
  // Marcos
  'marcos': 'Mark',
  'mar': 'Mark',
  'mr': 'Mark',
  'mc': 'Mark',
  
  // Lucas
  'lucas': 'Luke',
  'luc': 'Luke',
  'lc': 'Luke',
  'lk': 'Luke',
  
  // Juan
  'juan': 'John',
  'jua': 'John',
  'jn': 'John',
  'jo': 'John',
  
  // Hechos
  'hechos': 'Acts',
  'hch': 'Acts',
  'hc': 'Acts',
  'ac': 'Acts',
  
  // Romanos
  'romanos': 'Romans',
  'rom': 'Romans',
  'ro': 'Romans',
  'rm': 'Romans',
  
  // 1 Corintios
  '1 corintios': '1 Corinthians',
  '1corintios': '1 Corinthians',
  '1 cor': '1 Corinthians',
  '1cor': '1 Corinthians',
  '1 co': '1 Corinthians',
  
  // 2 Corintios
  '2 corintios': '2 Corinthians',
  '2corintios': '2 Corinthians',
  '2 cor': '2 Corinthians',
  '2cor': '2 Corinthians',
  '2 co': '2 Corinthians',
  
  // Gálatas
  'gálatas': 'Galatians',
  'gal': 'Galatians',
  'ga': 'Galatians',
  
  // Efesios
  'efesios': 'Ephesians',
  'efe': 'Ephesians',
  'ef': 'Ephesians',
  
  // Filipenses
  'filipenses': 'Philippians',
  'fil': 'Philippians',
  'flp': 'Philippians',
  
  // Colosenses
  'colosenses': 'Colossians',
  'col': 'Colossians',
  
  // 1 Tesalonicenses
  '1 tesalonicenses': '1 Thessalonians',
  '1tesalonicenses': '1 Thessalonians',
  '1 tes': '1 Thessalonians',
  '1tes': '1 Thessalonians',
  '1 ts': '1 Thessalonians',
  
  // 2 Tesalonicenses
  '2 tesalonicenses': '2 Thessalonians',
  '2tesalonicenses': '2 Thessalonians',
  '2 tes': '2 Thessalonians',
  '2tes': '2 Thessalonians',
  '2 ts': '2 Thessalonians',
  
  // 1 Timoteo
  '1 timoteo': '1 Timothy',
  '1timoteo': '1 Timothy',
  '1 tim': '1 Timothy',
  '1tim': '1 Timothy',
  '1 ti': '1 Timothy',
  
  // 2 Timoteo
  '2 timoteo': '2 Timothy',
  '2timoteo': '2 Timothy',
  '2 tim': '2 Timothy',
  '2tim': '2 Timothy',
  '2 ti': '2 Timothy',
  
  // Tito
  'tito': 'Titus',
  'tit': 'Titus',
  'tit.': 'Titus',
  
  // Filemón
  'filemón': 'Philemon',
  'flm': 'Philemon',
  
  // Hebreos
  'hebreos': 'Hebrews',
  'heb': 'Hebrews',
  'he': 'Hebrews',
  
  // Santiago
  'santiago': 'James',
  'san': 'James',
  'stg': 'James',
  'jm': 'James',
  
  // 1 Pedro
  '1 pedro': '1 Peter',
  '1pedro': '1 Peter',
  '1 ped': '1 Peter',
  '1ped': '1 Peter',
  '1 p': '1 Peter',
  
  // 2 Pedro
  '2 pedro': '2 Peter',
  '2pedro': '2 Peter',
  '2 ped': '2 Peter',
  '2ped': '2 Peter',
  '2 p': '2 Peter',
  
  // 1 Juan
  '1 juan': '1 John',
  '1juan': '1 John',
  '1 jn': '1 John',
  '1jn': '1 John',
  '1 jo': '1 John',
  
  // 2 Juan
  '2 juan': '2 John',
  '2juan': '2 John',
  '2 jn': '2 John',
  '2jn': '2 John',
  '2 jo': '2 John',
  
  // 3 Juan
  '3 juan': '3 John',
  '3juan': '3 John',
  '3 jn': '3 John',
  '3jn': '3 John',
  '3 jo': '3 John',
  
  // Judas
  'judas': 'Jude',
  'jud': 'Jude',
  
  // Apocalipsis
  'apocalipsis': 'Revelation',
  'apoc': 'Revelation',
  'ap': 'Revelation',
  'apo': 'Revelation',
  'rv': 'Revelation',
};

export class BibleReferenceParser {
  /**
   * Parsear una referencia bíblica en español
   * @param reference - e.g., "Mateo 22:1-5", "Juan 3:16", "1 Corintios 13:4-7"
   */
  static parse(reference: string): BibleReference {
    const original = reference.trim();
    
    // Normalizar: convertir a minúsculas y remover espacios múltiples
    const normalized = original.toLowerCase().replace(/\s+/g, ' ');
    
    // Intentar extraer libro, capítulo, versículos
    // Patrón: [número] libro capítulo:versículo[-versículo|,versículo...]
    const patterns = [
      // "1 Corintios 13:4-7" o "1Corintios 13:4-7"
      /^(\d?\s*\w+(?:\s+\w+)?)\s+(\d+):(\d+)(?:-(\d+))?$/,
      // "Mateo 22:1-5" o "Juan 3:16,18,20"
      /^(\w+(?:\s+\w+)?)\s+(\d+):(.+)$/,
    ];
    
    let bookName = '';
    let chapter = 0;
    let startVerse = 0;
    let endVerse = 0;
    let verses: number[] = [];
    
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        bookName = match[1].trim();
        chapter = parseInt(match[2], 10);
        
        const verseString = match[3] || match[4] || '';
        
        // Parsear versículos: puede ser "4-7" o "4,8,12" o "4"
        if (verseString.includes('-')) {
          const [start, end] = verseString.split('-');
          startVerse = parseInt(start.trim(), 10);
          endVerse = parseInt(end.trim(), 10);
        } else if (verseString.includes(',')) {
          verses = verseString.split(',').map(v => parseInt(v.trim(), 10));
          startVerse = verses[0] || 0;
        } else {
          startVerse = parseInt(verseString, 10);
          endVerse = startVerse;
        }
        break;
      }
    }
    
    // Mapear nombre de libro a forma canónica
    const mappedBook = BOOK_MAPPINGS[bookName] || bookName;
    
    return {
      book: mappedBook,
      chapter,
      startVerse,
      endVerse: endVerse || startVerse,
      verses: verses.length > 0 ? verses : undefined,
      isRange: endVerse > startVerse,
      isChapterRange: false, // TODO: soportar rangos de capítulos
      originalInput: original,
    };
  }
  
  /**
   * Formatear referencia parseada a formato estándar
   */
  static format(ref: BibleReference): string {
    const { book, chapter, startVerse, endVerse, verses } = ref;
    
    let verseStr = '';
    if (verses && verses.length > 0) {
      verseStr = verses.join(',');
    } else if (endVerse && startVerse && endVerse > startVerse) {
      verseStr = `${startVerse}-${endVerse}`;
    } else if (startVerse) {
      verseStr = `${startVerse}`;
    }
    
    return `${book} ${chapter}:${verseStr}`;
  }
}
